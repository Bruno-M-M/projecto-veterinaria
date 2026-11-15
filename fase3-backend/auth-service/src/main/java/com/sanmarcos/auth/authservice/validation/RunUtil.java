package com.sanmarcos.auth.authservice.validation;

import java.util.regex.Pattern;

public final class RunUtil {

    private static final Pattern FORMATO = Pattern.compile("^\\d{7,8}-[0-9K]$");

    private RunUtil() {}

    public static String normalizar(String run) {
        if (run == null) return null;
        String s = run.replace(".", "").replace(" ", "").toUpperCase();
        if (!s.contains("-") && s.length() >= 2) {
            s = s.substring(0, s.length() - 1) + "-" + s.substring(s.length() - 1);
        }
        return s;
    }

    public static boolean esValido(String run) {
        String s = normalizar(run);
        if (s == null || !FORMATO.matcher(s).matches()) return false;
        String cuerpo = s.substring(0, s.indexOf('-'));
        char dv = s.charAt(s.length() - 1);
        return calcularDv(cuerpo) == dv;
    }

    static char calcularDv(String cuerpo) {
        int suma = 0, factor = 2;
        for (int i = cuerpo.length() - 1; i >= 0; i--) {
            suma += (cuerpo.charAt(i) - '0') * factor;
            factor = factor == 7 ? 2 : factor + 1;
        }
        int resto = 11 - (suma % 11);
        if (resto == 11) return '0';
        if (resto == 10) return 'K';
        return (char) ('0' + resto);
    }
}
