import { motion } from 'framer-motion';
import { ShieldX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md w-full"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          className="flex items-center justify-center mx-auto mb-6 w-24 h-24 rounded-full bg-destructive/10"
        >
          <ShieldX className="h-12 w-12 text-destructive" />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">
            غير مصرح بالوصول
          </h1>
          <p className="text-muted-foreground mb-1">
            مرحباً{user?.full_name ? ` ${user.full_name}` : ''}،
          </p>
          <p className="text-muted-foreground mb-8">
            ليس لديك صلاحية الوصول إلى لوحة التحكم.
            <br />
            تواصل مع المسؤول لمنحك الصلاحيات اللازمة.
          </p>

          <Button
            variant="destructive"
            onClick={() => logout()}
            className="w-full sm:w-auto"
          >
            تسجيل الخروج
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
