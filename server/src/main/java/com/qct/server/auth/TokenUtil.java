package com.qct.server.auth;

import com.qct.server.common.Json;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 简化版 JWT（HS256）：
 * header.payload.signature，payload = { uid, role, exp }
 */
public final class TokenUtil {

    private static final String HMAC_ALGO = "HmacSHA256";
    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder B64D = Base64.getUrlDecoder();

    private TokenUtil() {
    }

    public static String create(String uid, String role, long expireMs, String secret) {
        String header = B64.encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("uid", uid);
        payload.put("role", role);
        payload.put("exp", expireMs);
        String payloadStr = B64.encodeToString(Json.write(payload).getBytes(StandardCharsets.UTF_8));

        String signingInput = header + "." + payloadStr;
        String signature = sign(signingInput, secret);
        return signingInput + "." + signature;
    }

    /**
     * 校验并解析 token。
     *
     * @return payload；token 无效或过期返回 null
     */
    public static Map<String, Object> verify(String token, String secret) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            String expected = sign(parts[0] + "." + parts[1], secret);
            if (!constantTimeEquals(expected, parts[2])) {
                return null;
            }
            Map<String, Object> payload = Json.parseObject(new String(B64D.decode(parts[1]), StandardCharsets.UTF_8));
            Object exp = payload.get("exp");
            if (!(exp instanceof Number)) {
                return null;
            }
            if (((Number) exp).longValue() < System.currentTimeMillis()) {
                return null;
            }
            return payload;
        } catch (Exception e) {
            return null;
        }
    }

    private static String sign(String input, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGO));
            return B64.encodeToString(mac.doFinal(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC 签名失败", e);
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
