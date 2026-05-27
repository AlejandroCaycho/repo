package com.vg.auth.util;

import java.util.UUID;

public class UuidUtil {

    private UuidUtil() {}

    public static UUID parse(String uuid) {
        try {
            return UUID.fromString(uuid);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("UUID inválido: " + uuid);
        }
    }
}