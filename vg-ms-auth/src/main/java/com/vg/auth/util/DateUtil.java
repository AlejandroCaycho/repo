package com.vg.auth.util;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

public class DateUtil {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private DateUtil() {}

    public static OffsetDateTime now() {
        return OffsetDateTime.now(ZoneId.of("America/Lima"));
    }

    public static boolean isExpired(OffsetDateTime dateTime) {
        return dateTime != null && dateTime.isBefore(now());
    }

    public static String formatDateTime(OffsetDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.atZoneSameInstant(ZoneId.of("America/Lima"))
                .format(DATE_TIME_FORMATTER);
    }

    public static String formatTime(LocalTime time) {
        return time == null ? null : time.format(TIME_FORMATTER);
    }
}
