package com.qct.server.service;

import com.qct.server.common.BizException;
import com.qct.server.common.Ids;
import com.qct.server.common.R;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** 注册用图块滑动验证。挑战和校验均由后端维护。 */
@Service
public class SliderCaptchaService {

    private static final long CHALLENGE_TTL_MILLIS = 5 * 60 * 1000L;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Challenge> challenges = new ConcurrentHashMap<>();

    public Map<String, Object> createChallenge() {
        String challengeId = Ids.newId();
        int trackWidth = 300;
        int targetOffset = 72 + random.nextInt(170);
        challenges.put(challengeId, new Challenge(targetOffset, System.currentTimeMillis()));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("challengeId", challengeId);
        data.put("targetOffset", targetOffset);
        data.put("trackWidth", trackWidth);
        return R.ok(data);
    }

    public void verify(String challengeId, Object position) {
        if (challengeId == null || challengeId.isBlank()) {
            throw new BizException("请先完成图块验证");
        }
        int sliderPosition;
        try {
            sliderPosition = Integer.parseInt(String.valueOf(position));
        } catch (Exception e) {
            throw new BizException("请完成图块验证");
        }

        Challenge challenge = challenges.remove(challengeId);
        if (challenge == null || System.currentTimeMillis() - challenge.createdAt > CHALLENGE_TTL_MILLIS) {
            throw new BizException("图块验证已失效，请刷新后重试");
        }
        if (Math.abs(challenge.targetOffset - sliderPosition) > 6) {
            throw new BizException("图块位置不正确，请重新验证");
        }
    }

    private record Challenge(int targetOffset, long createdAt) {
    }
}
