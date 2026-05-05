import { motion } from 'framer-motion';
import { ShieldOff, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NoAccessPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="text-center max-w-sm w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 180 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6"
        >
          <ShieldOff className="h-10 w-10 text-muted-foreground" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h1 className="text-xl font-bold text-foreground mb-2">
            لا توجد صلاحيات
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            مرحباً{user?.full_name ? ` ${user.full_name}` : ''}، حسابك لا يملك
            أي صلاحيات بعد.
            <br />
            تواصل مع المسؤول لإعداد صلاحياتك.
          </p>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
