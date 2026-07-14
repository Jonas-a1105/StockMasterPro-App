import { useState, useCallback } from 'react';
import type { LoginCredentials, RegisterData, ForgotPasswordData, ResetPasswordData } from '../types/auth.types';

type AuthFormValues =
  | LoginCredentials
  | RegisterData
  | ForgotPasswordData
  | ResetPasswordData;

type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>;

interface UseAuthFormOptions<T extends AuthFormValues> {
  initialValues: T;
  validate?: (values: T) => AuthFormErrors;
  onSubmit: (values: T) => Promise<void>;
}

interface UseAuthFormReturn<T extends AuthFormValues> {
  values: T;
  errors: AuthFormErrors;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
  resetForm: () => void;
}

export function useAuthForm<T extends AuthFormValues>({
  initialValues,
  validate,
  onSubmit,
}: UseAuthFormOptions<T>): UseAuthFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type, checked } = e.target;
      setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
      if (touched[name as keyof T]) {
        const newValues = { ...values, [name]: type === 'checkbox' ? checked : value };
        if (validate) {
          const validationErrors = validate(newValues);
          setErrors((prev) => ({ ...prev, ...validationErrors }));
        }
      }
    },
    [touched, values, validate]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      if (validate) {
        const validationErrors = validate(values);
        setErrors((prev) => ({ ...prev, ...validationErrors }));
      }
    },
    [values, validate]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          setTouched(
            Object.keys(values).reduce(
              (acc, key) => ({ ...acc, [key]: true }),
              {} as Partial<Record<keyof T, boolean>>
            )
          );
          return;
        }
      }
      setIsSubmitting(true);
      setErrors({});
      try {
        await onSubmit(values);
      } catch (error: any) {
        setErrors({ submit: error.message || 'Error en la operación' } as AuthFormErrors);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    clearErrors,
    resetForm,
  };
}

export function useLoginForm(onSubmit: (values: LoginCredentials) => Promise<void>) {
  const initialValues: LoginCredentials = {
    email: '',
    password: '',
    rememberMe: false,
  };

  const validate = useCallback((values: LoginCredentials) => {
    const errors: AuthFormErrors = {};
    if (!values.email) {
      errors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Formato de email inválido';
    }
    if (!values.password) {
      errors.password = 'La contraseña es obligatoria';
    }
    return errors;
  }, []);

  return useAuthForm({ initialValues, validate, onSubmit });
}

export function useRegisterForm(onSubmit: (values: RegisterData) => Promise<void>) {
  const initialValues: RegisterData = {
    tenantName: '',
    name: '',
    email: '',
    password: '',
  };

  const validate = useCallback((values: RegisterData) => {
    const errors: AuthFormErrors = {};
    if (!values.tenantName.trim()) {
      errors.tenantName = 'El nombre de la empresa es obligatorio';
    }
    if (!values.name.trim()) {
      errors.name = 'El nombre del operador es obligatorio';
    }
    if (!values.email) {
      errors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Formato de email inválido';
    }
    if (!values.password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (values.password.length < 8) {
      errors.password = 'Mínimo 8 caracteres';
    } else if (!/[A-Z]/.test(values.password)) {
      errors.password = 'Debe incluir al menos una mayúscula';
    } else if (!/[0-9]/.test(values.password)) {
      errors.password = 'Debe incluir al menos un número';
    }
    return errors;
  }, []);

  return useAuthForm({ initialValues, validate, onSubmit });
}

export function useForgotPasswordForm(onSubmit: (values: ForgotPasswordData) => Promise<void>) {
  const initialValues: ForgotPasswordData = { email: '' };

  const validate = useCallback((values: ForgotPasswordData) => {
    const errors: AuthFormErrors = {};
    if (!values.email) {
      errors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = 'Formato de email inválido';
    }
    return errors;
  }, []);

  return useAuthForm({ initialValues, validate, onSubmit });
}

export function useResetPasswordForm(onSubmit: (values: ResetPasswordData) => Promise<void>) {
  const initialValues: ResetPasswordData = {
    token: '',
    password: '',
    confirmPassword: '',
  };

  const validate = useCallback((values: ResetPasswordData) => {
    const errors: AuthFormErrors = {};
    if (!values.password) {
      errors.password = 'La contraseña es obligatoria';
    } else if (values.password.length < 8) {
      errors.password = 'Mínimo 8 caracteres';
    } else if (!/[A-Z]/.test(values.password)) {
      errors.password = 'Debe incluir al menos una mayúscula';
    } else if (!/[0-9]/.test(values.password)) {
      errors.password = 'Debe incluir al menos un número';
    }
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    return errors;
  }, []);

  return useAuthForm({ initialValues, validate, onSubmit });
}