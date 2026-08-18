package com.qct.server.service;

import com.qct.server.auth.TokenUtil;
import com.qct.server.common.BizException;
import com.qct.server.common.Ids;
import com.qct.server.common.R;
import com.qct.server.common.Times;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户认证：网页版使用手机号和密码注册、登录。
 */
@Service
public class AuthService {

    private final JdbcTemplate jdbc;
    private final SliderCaptchaService sliderCaptchaService;
    private final String jwtSecret;
    private final long tokenExpireHours;

    public AuthService(JdbcTemplate jdbc,
                       SliderCaptchaService sliderCaptchaService,
                       @Value("${qct.jwt-secret}") String jwtSecret,
                       @Value("${qct.token-expire-hours:168}") long tokenExpireHours) {
        this.jdbc = jdbc;
        this.sliderCaptchaService = sliderCaptchaService;
        this.jwtSecret = jwtSecret;
        this.tokenExpireHours = tokenExpireHours;
    }

    public Map<String, Object> dispatch(Map<String, Object> event) {
        String type = str(event.get("type"));
        try {
            switch (type == null ? "" : type) {
                case "slider_challenge":
                    return sliderCaptchaService.createChallenge();
                case "register":
                    return register(event);
                case "login":
                    return login(event);
                case "logout":
                    return logout(event);
                case "userinfo":
                    return userInfo(event);
                case "refresh":
                    return R.okMsg("会话刷新成功");
                default:
                    return R.fail("未知的操作类型");
            }
        } catch (BizException e) {
            return R.fail(e.getMessage());
        } catch (Exception e) {
            return R.fail("服务器内部错误: " + e.getMessage());
        }
    }

    /** 普通用户注册：姓名 + 手机号 + 密码 + 图块滑动验证。 */
    private Map<String, Object> register(Map<String, Object> event) {
        String name = requireName(event);
        String phone = requirePhone(event);
        String password = requirePassword(event);
        sliderCaptchaService.verify(str(event.get("sliderChallengeId")), event.get("sliderPosition"));

        if (!jdbc.queryForList("SELECT id FROM users WHERE phone = ?", phone).isEmpty()) {
            throw new BizException("该手机号已注册，请直接登录");
        }

        String userId = Ids.newId();
        long now = Times.now();
        jdbc.update("INSERT INTO users (id, openid, nickname, name, phone, password_hash, avatar, gender, last_login_time, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                userId, "web_" + userId, name, name, phone, hashPassword(password), "", "", now, now, now);
        return loginResult(userId, name, phone, now);
    }

    /** 普通用户登录：手机号 + 密码。 */
    private Map<String, Object> login(Map<String, Object> event) {
        String phone = requirePhone(event);
        String password = str(event.get("password"));
        if (password == null || password.isBlank()) {
            throw new BizException("密码不能为空");
        }

        List<Map<String, Object>> users = jdbc.queryForList("SELECT * FROM users WHERE phone = ?", phone);
        if (users.isEmpty()) {
            throw new BizException("手机号或密码错误");
        }
        Map<String, Object> user = users.get(0);
        if (!verifyPassword(password, str(user.get("password_hash")))) {
            throw new BizException("手机号或密码错误");
        }

        long now = Times.now();
        String userId = str(user.get("id"));
        jdbc.update("UPDATE users SET last_login_time = ?, updated_at = ? WHERE id = ?", now, now, userId);
        return loginResult(userId, str(user.get("name")), phone, now);
    }

    private Map<String, Object> loginResult(String userId, String name, String phone, long loginTime) {
        String token = TokenUtil.create(userId, "user",
                System.currentTimeMillis() + tokenExpireHours * 3600_000L, jwtSecret);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("token", token);
        data.put("userInfo", userInfo(userId, name, phone, loginTime));
        return R.ok(data);
    }

    private Map<String, Object> userInfo(String userId, String name, String phone, long loginTime) {
        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("_id", userId);
        userInfo.put("openid", "web_" + userId);
        userInfo.put("nickname", name);
        userInfo.put("name", name);
        userInfo.put("phone", phone);
        userInfo.put("student_id", "");
        userInfo.put("avatar", "");
        userInfo.put("gender", 0);
        userInfo.put("lastLoginTime", Times.iso(loginTime));
        return userInfo;
    }

    private String requireName(Map<String, Object> event) {
        String name = str(event.get("name"));
        if (name == null || name.trim().isBlank()) {
            throw new BizException("姓名不能为空");
        }
        return name.trim();
    }

    private String requirePhone(Map<String, Object> event) {
        String phone = str(event.get("phone"));
        if (phone == null || !phone.trim().matches("^1[3-9]\\d{9}$")) {
            throw new BizException("请输入正确的手机号");
        }
        return phone.trim();
    }

    private String requirePassword(Map<String, Object> event) {
        String password = str(event.get("password"));
        if (password == null || !password.matches("^(?=.*[A-Za-z])(?=.*\\d).+$")) {
            throw new BizException("密码必须同时包含字母和数字");
        }
        return password;
    }

    private String hashPassword(String password) {
        try {
            byte[] salt = new byte[16];
            new SecureRandom().nextBytes(salt);
            byte[] hash = pbkdf2(password.toCharArray(), salt, 120_000);
            return "120000:" + Base64.getEncoder().encodeToString(salt) + ":" + Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("密码处理失败", e);
        }
    }

    private boolean verifyPassword(String password, String stored) {
        if (stored == null || stored.isBlank()) {
            return false;
        }
        try {
            String[] parts = stored.split(":");
            if (parts.length != 3) {
                return false;
            }
            int iterations = Integer.parseInt(parts[0]);
            byte[] salt = Base64.getDecoder().decode(parts[1]);
            byte[] expected = Base64.getDecoder().decode(parts[2]);
            byte[] actual = pbkdf2(password.toCharArray(), salt, iterations);
            return MessageDigest.isEqual(expected, actual);
        } catch (Exception e) {
            return false;
        }
    }

    private byte[] pbkdf2(char[] password, byte[] salt, int iterations) throws Exception {
        PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, 256);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } finally {
            spec.clearPassword();
        }
    }

    private Map<String, Object> logout(Map<String, Object> event) {
        String userId = str(event.get("userId"));
        if (userId != null && !userId.isBlank()) {
            jdbc.update("UPDATE users SET last_logout_time = ?, updated_at = ? WHERE id = ?",
                    Times.now(), Times.now(), userId);
        }
        return R.okMsg("登出成功");
    }

    private Map<String, Object> userInfo(Map<String, Object> event) {
        String userId = str(event.get("userId"));
        if (userId == null || userId.isBlank()) {
            throw new BizException("缺少用户ID");
        }
        Map<String, Object> user = findUserById(userId);
        if (user == null) {
            throw new BizException("用户不存在");
        }
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("_id", user.get("id"));
        info.put("openid", user.get("openid"));
        info.put("nickname", user.get("nickname"));
        info.put("name", user.get("name"));
        info.put("student_id", user.get("student_id"));
        info.put("phone", user.get("phone"));
        info.put("avatar", user.get("avatar"));
        info.put("gender", user.get("gender"));
        info.put("lastLoginTime", Times.iso(toLong(user.get("last_login_time"))));
        return R.ok(info);
    }

    /** 供其他服务使用 */
    public Map<String, Object> findUserById(String userId) {
        List<Map<String, Object>> users = jdbc.queryForList("SELECT * FROM users WHERE id = ?", userId);
        return users.isEmpty() ? null : users.get(0);
    }

    static String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    static Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    static Integer toInt(Object value) {
        Long l = toLong(value);
        return l == null ? null : l.intValue();
    }

    static List<String> toStringList(Object value) {
        if (value == null) {
            return List.of();
        }
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        return List.of(String.valueOf(value));
    }
}
