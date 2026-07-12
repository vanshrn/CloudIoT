import LoginForm from "../components/auth/LoginForm";
import AuthBrand from "../components/auth/AuthBrand";
import AuthContainer from "../components/auth/AuthContainer";
import AuthLayout from "../layouts/AuthLayout";

export default function LoginPage() {
    return (
        <AuthLayout>
            <AuthBrand />

            <AuthContainer>
                <LoginForm />
            </AuthContainer>
        </AuthLayout>
    );
}