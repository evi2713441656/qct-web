package com.qct.server.auth;

/**
 * 当前请求的鉴权上下文（ThreadLocal）。
 */
public final class AuthContext {

    private static final ThreadLocal<Context> HOLDER = new ThreadLocal<>();

    private AuthContext() {
    }

    public static void set(Context context) {
        HOLDER.set(context);
    }

    public static Context get() {
        Context context = HOLDER.get();
        return context == null ? Context.empty() : context;
    }

    public static void clear() {
        HOLDER.remove();
    }

    public static class Context {
        /** 用户 token 中的用户 ID（可能为 null） */
        public final String userId;
        /** 管理员 token 中的管理员 ID（可能为 null） */
        public final String adminId;
        /** 管理员角色（可能为 null） */
        public final String adminRole;

        public Context(String userId, String adminId, String adminRole) {
            this.userId = userId;
            this.adminId = adminId;
            this.adminRole = adminRole;
        }

        public static Context empty() {
            return new Context(null, null, null);
        }

        public boolean hasUser() {
            return userId != null && !userId.isBlank();
        }

        public boolean hasAdmin() {
            return adminId != null && !adminId.isBlank();
        }
    }
}
