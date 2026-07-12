import { useMemo, useState } from "react";

export default function useLoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const emailError =
        email.length > 0 &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const passwordError =
        password.length > 0 &&
        password.length < 8;

    const isValid = useMemo(() => {
        return (
            email.length > 0 &&
            password.length >= 8 &&
            !emailError
        );
    }, [email, password, emailError]);

    return {
        email,
        password,
        rememberMe,
        showPassword,

        emailError,
        passwordError,

        isValid,

        setEmail,
        setPassword,
        setRememberMe,
        setShowPassword,
    };
}