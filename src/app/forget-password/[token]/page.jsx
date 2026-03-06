import ForgotPasswordArea from "@/components/fortgot-password/forgot-password-area";

export const metadata = {
  title: "Shofy - Forget Password Page",
};

export default async function ForgetPasswordPage({ params }) {
  const { token } = await params;
  return (
    <>
      <ForgotPasswordArea token={token} />
    </>
  );
}
