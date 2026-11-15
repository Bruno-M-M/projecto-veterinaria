package com.sanmarcos.auth.authservice.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class RunValidator implements ConstraintValidator<RunValido, String> {

    @Override
    public boolean isValid(String valor, ConstraintValidatorContext ctx) {
        return valor == null || valor.isBlank() || RunUtil.esValido(valor);
    }
}