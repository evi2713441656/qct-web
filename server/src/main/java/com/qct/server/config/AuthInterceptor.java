package com.qct.server.config;

import com.qct.server.auth.AuthContext;
import com.qct.server.auth.TokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;

/**
 * 解析请求头中的登录凭证：
 * - Authorization: Bearer <userToken>
 * - X-Admin-Token: <adminToken>
 * 仅解析身份，权限校验由具体业务处理。
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final String jwtSecret;

    public AuthInterceptor(@Value("${qct.jwt-secret}") String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        AuthContext.Context context = AuthContext.Context.empty();

        String adminToken = request.getHeader("X-Admin-Token");
        if (adminToken != null && !adminToken.isBlank()) {
            Map<String, Object> payload = TokenUtil.verify(adminToken, jwtSecret);
            if (payload != null && "admin".equals(payload.get("role"))) {
                Object uid = payload.get("uid");
                if (uid != null) {
                    context = new AuthContext.Context(
                            null,
                            String.valueOf(uid),
                            payload.get("role") != null ? String.valueOf(payload.get("role")) : null);
                }
            }
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            Map<String, Object> payload = TokenUtil.verify(authHeader.substring(7), jwtSecret);
            if (payload != null) {
                Object uid = payload.get("uid");
                String role = payload.get("role") != null ? String.valueOf(payload.get("role")) : null;
                if ("admin".equals(role)) {
                    if (!context.hasAdmin() && uid != null) {
                        context = new AuthContext.Context(null, String.valueOf(uid), role);
                    }
                } else if (uid != null) {
                    context = new AuthContext.Context(String.valueOf(uid), context.adminId, context.adminRole);
                }
            }
        }

        AuthContext.set(context);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        AuthContext.clear();
    }
}
