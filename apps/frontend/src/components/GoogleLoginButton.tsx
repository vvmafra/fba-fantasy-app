import { useEffect } from "react";
import { AUTH_CONFIG, GoogleLoginResponse, GoogleCredentialResponse } from "@/lib/auth";

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
    // Certifique-se que o script foi carregado antes de usar google.accounts.id
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: AUTH_CONFIG.GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-login-button"),
        {
          theme: "outline",
          size: "large",
        }
      );
    }
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
          console.log("Login bem-sucedido:", data);
          
          // Salvar token no localStorage
          localStorage.setItem('authToken', data.data.token);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          
          console.log("Token salvo:", data.data.token);
          console.log("Usuário salvo:", data.data.user);
          
          // Sua lógica de redirecionamento com base no time
          if (!data.data.user.teamId) {
            alert("Seu e-mail não está vinculado a um time. Solicite permissão.");
          } else {
            console.log("Redirecionando para /teams");
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