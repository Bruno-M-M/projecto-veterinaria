package com.sanmarcos.auth.authservice.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = RunValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface RunValido {
    String message() default "El RUN no es válido";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
