package com.qct.server.service;

import com.qct.server.common.BizException;
import com.qct.server.common.R;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * 注册短信验证码。
 *
 * 未配置短信服务商时由前端使用图块滑动挑战；本地可临时开启 mock 短信模式，生产环境可配置短信 webhook。
 */
@Service
public class SmsCodeService {

    private static final Logger log = LoggerFactory.getLogger(SmsCodeService.class);
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");
    private static final long CODE_TTL_MILLIS = 5 * 60 * 1000L;
    private static final long RESEND_INTERVAL_MILLIS = 60 * 1000L;

    private final JdbcTemplate jdbc;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, CodeEntry> codes = new ConcurrentHashMap<>();
    private final Map<String, SliderEntry> sliderChallenges = new ConcurrentHashMap<>();
    private final boolean mock;
    private final String webhookUrl;
    private final String webhookToken;

    public SmsCodeService(JdbcTemplate jdbc,
                          @Value("${qct.sms.mock:true}") boolean mock,
                          @Value("${qct.sms.webhook-url:}") String webhookUrl,
                          @Value("${qct.sms.webhook-token:}") String webhookToken) {
        this.jdbc = jdbc;
        this.mock = mock;
        this.webhookUrl = webhookUrl == null ? "" : webhookUrl.trim();
        this.webhookToken = webhookToken == null ? "" : webhookToken.trim();
    }

    public boolean isSmsEnabled() {
        return mock || !webhookUrl.isBlank();
    }

    public Map<String, Object> createSliderChallenge() {
        String challengeId = com.qct.server.common.Ids.newId();
        int trackWidth = 300;
        int targetOffset = 72 + random.nextInt(170);
        sliderChallenges.put(challengeId, new SliderEntry(targetOffset, System.currentTimeMillis()));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("challengeId", challengeId);
        data.put("targetOffset", targetOffset);
        data.put("trackWidth", trackWidth);
        return R.ok(data);
    }

    public void verifySlider(String challengeId, Object position) {
        if (challengeId == null || challengeId.isBlank()) {
            throw new BizException("请先完成图块验证");
        }
        int sliderPosition;
        try {
            sliderPosition = Integer.parseInt(String.valueOf(position));
        } catch (Exception e) {
            throw new BizException("请完成图块验证");
        }
        SliderEntry entry = sliderChallenges.remove(challengeId);
        if (entry == null || System.currentTimeMillis() - entry.createdAt > CODE_TTL_MILLIS) {
            throw new BizException("图块验证已失效，请刷新后重试");
        }
        if (Math.abs(entry.targetOffset - sliderPosition) > 6) {
            throw new BizException("图块位置不正确，请重新验证");
        }
    }

    public Map<String, Object> sendCode(String phone) {
        validatePhone(phone);
        if (!jdbc.queryForList("SELECT id FROM users WHERE phone = ?", phone).isEmpty()) {
            throw new BizException("该手机号已注册，请直接登录");
        }

        long now = System.currentTimeMillis();
        CodeEntry previous = codes.get(phone);
        if (previous != null && now - previous.sentAt < RESEND_INTERVAL_MILLIS) {
            long seconds = Math.max(1, (RESEND_INTERVAL_MILLIS - (now - previous.sentAt)) / 1000);
            throw new BizException("请 " + seconds + " 秒后再获取验证码");
        }

        String code = String.format("%06d", random.nextInt(1_000_000));
        if (mock) {
            log.info("SMS mock code for {}: {} (expires in 5 minutes)", phone, code);
        } else {
            sendThroughWebhook(phone, code);
        }
        codes.put(phone, new CodeEntry(code, now));

        Map<String, Object> data = new LinkedHashMap<>();
        // 仅 mock 模式返回调试验证码，生产模式绝不将验证码返回给浏览器。
        if (mock) {
            data.put("debugCode", code);
        }
        return R.ok(data, "验证码已发送");
    }

    public void verify(String phone, String code) {
        validatePhone(phone);
        if (code == null || !code.trim().matches("^\\d{6}$")) {
            throw new BizException("请输入 6 位短信验证码");
        }
        CodeEntry entry = codes.get(phone);
        if (entry == null || System.currentTimeMillis() - entry.sentAt > CODE_TTL_MILLIS) {
            codes.remove(phone);
            throw new BizException("验证码已失效，请重新获取");
        }
        if (!MessageDigest.isEqual(entry.code.getBytes(), code.trim().getBytes())) {
            throw new BizException("短信验证码错误");
        }
        codes.remove(phone);
    }

    private void sendThroughWebhook(String phone, String code) {
        if (webhookUrl.isBlank()) {
            throw new BizException("短信服务未配置，请联系管理员");
        }
        try {
            RestClient client = RestClient.builder().build();
            client.post()
                    .uri(webhookUrl)
                    .headers(headers -> {
                        if (!webhookToken.isBlank()) {
                            headers.setBearerAuth(webhookToken);
                        }
                    })
                    .body(Map.of("phone", phone, "code", code, "template", "qct_register"))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            throw new BizException("短信发送失败，请稍后重试");
        }
    }

    private void validatePhone(String phone) {
        if (phone == null || !PHONE_PATTERN.matcher(phone.trim()).matches()) {
            throw new BizException("请输入正确的手机号");
        }
    }

    private record CodeEntry(String code, long sentAt) {
    }

    private record SliderEntry(int targetOffset, long createdAt) {
    }
}
