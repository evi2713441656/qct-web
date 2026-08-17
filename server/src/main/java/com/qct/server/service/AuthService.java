package com.qct.server.service;

import com.qct.server.auth.TokenUtil;
import com.qct.server.common.BizException;
import com.qct.server.common.Ids;
import com.qct.server.common.R;
import com.qct.server.common.Times;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户认证：网页版使用 学号 + 姓名 表单登录。
 */
@Service
public class AuthService {

    private final JdbcTemplate jdbc;
    private final String jwtSecret;
    private final long tokenExpireHours;

    public AuthService(JdbcTemplate jdbc,
                       @Value("${qct.jwt-secret}") String jwtSecret,
                       @Value("${qct.token-expire-hours:168}") long tokenExpireHours) {
        this.jdbc = jdbc;
        this.jwtSecret = jwtSecret;
        this.tokenExpireHours = tokenExpireHours;
    }

    public Map<String, Object> dispatch(Map<String, Object> event) {
        String type = str(event.get("type"));
        try {
            switch (type == null ? "" : type) {
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

    /** 学号 + 姓名登录（不存在则自动注册） */
    private Map<String, Object> login(Map<String, Object> event) {
        String studentId = str(event.get("studentId"));
        String name = str(event.get("name"));

        if (studentId == null || studentId.isBlank()) {
            throw new BizException("学号不能为空");
        }
        if (name == null || name.isBlank()) {
            throw new BizException("姓名不能为空");
        }
        studentId = studentId.trim();
        name = name.trim();

        List<Map<String, Object>> users = jdbc.queryForList(
                "SELECT * FROM users WHERE student_id = ?", studentId);

        String userId;
        if (users.isEmpty()) {
            userId = Ids.newId();
            long now = Times.now();
            jdbc.update("INSERT INTO users (id, openid, nickname, name, student_id, avatar, gender, last_login_time, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    userId, "web_" + studentId, name, name, studentId, "", "", now, now, now);
        } else {
            Map<String, Object> user = users.get(0);
            String existingName = str(user.get("name"));
            if (existingName != null && !existingName.isBlank() && !existingName.equals(name)) {
                throw new BizException("学号与姓名不匹配，请核对后重试");
            }
            userId = str(user.get("id"));
            jdbc.update("UPDATE users SET nickname = ?, name = ?, last_login_time = ?, updated_at = ? WHERE id = ?",
                    name, name, Times.now(), Times.now(), userId);
        }

        String token = TokenUtil.create(userId, "user",
                System.currentTimeMillis() + tokenExpireHours * 3600_000L, jwtSecret);

        Map<String, Object> userInfo = new LinkedHashMap<>();
        userInfo.put("_id", userId);
        userInfo.put("openid", "web_" + studentId);
        userInfo.put("nickname", name);
        userInfo.put("name", name);
        userInfo.put("student_id", studentId);
        userInfo.put("avatar", "");
        userInfo.put("gender", 0);
        userInfo.put("lastLoginTime", Times.iso(Times.now()));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("token", token);
        data.put("userInfo", userInfo);
        return R.ok(data);
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
