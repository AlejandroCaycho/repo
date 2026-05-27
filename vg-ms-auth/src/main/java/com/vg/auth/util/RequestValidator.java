package com.vg.auth.util;

import com.vg.auth.exception.BadRequestException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RequestValidator {

    private final Validator validator;

    public <T> Mono<T> validate(T request) {
        var violations = validator.validate(request);
        if (violations.isEmpty()) {
            return Mono.just(request);
        }
        String errors = violations.stream()
                .map(ConstraintViolation::getMessage)
                .sorted()
                .collect(Collectors.joining("; "));
        return Mono.error(new BadRequestException(errors));
    }
}
