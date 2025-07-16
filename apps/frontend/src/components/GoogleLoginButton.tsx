import { useEffect } from "react";
import { AUTH_CONFIG, GoogleLoginResponse, GoogleCredentialResponse, authStorage } from "@/lib/auth";

// Declarações de tipo para o Google SDK
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, options: any) => void;
        };
      };
    };
  }
}

const GoogleLoginButton = () => {
  useEffect(() => {
    let tries = 0;
    function tryInit() {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: AUTH_CONFIG.GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-login-button"),
          { theme: "outline", size: "large" }
        );
      } else if (tries < 50) {
        tries++;
        setTimeout(tryInit, 100);
      }
    }
    tryInit();
  }, []);

  const handleCredentialResponse = (response: GoogleCredentialResponse) => {
    const idToken = response.credential;

    // Enviar para seu backend validar e autenticar o usuário
    fetch(`${AUTH_CONFIG.BACKEND_URL}${AUTH_CONFIG.ENDPOINTS.GOOGLE_LOGIN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: idToken }),
    })
      .then((res) => res.json())
      .then((data: GoogleLoginResponse) => {
        if (data.error) {
          alert("Erro na autenticação: " + data.error);
        } else {
          // Salvar dados de autenticação usando o novo sistema de cache
          authStorage.saveAuth(data.data);
              
          // Sua lógica de redirecionamento com base no time
          if (!data.data.user.teamId) {
            alert("Seu e-mail não está vinculado a um time. Solicite permissão à administração.");
          } else {
            window.location.href = `/teams`;
          }
        }
      })
      .catch((error) => {
        console.error("Erro na requisição:", error);
        alert("Erro ao conectar com o servidor. Tente novamente.");
      });
  };

  return <div id="google-login-button"></div>;
};

export default GoogleLoginButton; 