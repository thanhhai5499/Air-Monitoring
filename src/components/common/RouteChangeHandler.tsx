import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Component theo dõi thay đổi route và thực hiện các hành động cần thiết khi route thay đổi.
 * Trong trường hợp này, nó giúp đảm bảo rằng các thay đổi của Helmet được áp dụng.
 */
export const RouteChangeHandler: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Force re-rendering of document title when route changes
    // Điều này giúp đảm bảo rằng tiêu đề được cập nhật khi chuyển route
    const titleElement = document.querySelector('title');
    if (titleElement) {
      const currentTitle = titleElement.textContent;
      titleElement.textContent = currentTitle || '';
    }
  }, [location]);

  // This component doesn't render anything visible
  return null;
};

export default RouteChangeHandler; 