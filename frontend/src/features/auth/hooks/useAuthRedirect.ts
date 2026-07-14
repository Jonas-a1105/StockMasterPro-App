import { useNavigate, useLocation } from 'react-router-dom';

export function useAuthRedirect(defaultPath = '/dashboard') {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterAuth = useCallback(
    (customPath?: string) => {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      const target = customPath || from || defaultPath;
      navigate(target, { replace: true });
    },
    [location.state, defaultPath, navigate]
  );

  return { redirectAfterAuth };
}