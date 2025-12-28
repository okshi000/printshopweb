import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Shield,
  Mail,
  Calendar,
  UserCircle,

  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '../../api';
import { formatDate } from '@/lib/utils';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions_count: number;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  permissions: string[];
  users_count: number;
}

interface Permission {
  name: string;
  label: string;
}

const userSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional().or(z.literal('')),
  password_confirmation: z.string().optional(),
  role: z.string().min(1, 'الدور مطلوب'),
}).refine((data) => {
  if (data.password && data.password !== data.password_confirmation) {
    return false;
  }
  return true;
}, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['password_confirmation'],
});

const roleSchema = z.object({
  name: z.string().min(1, 'اسم الدور مطلوب'),
  permissions: z.array(z.string()),
});

type UserFormData = z.infer<typeof userSchema>;
type RoleFormData = z.infer<typeof roleSchema>;

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [addRoleModalOpen, setAddRoleModalOpen] = useState(false);
  const [editRoleModalOpen, setEditRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<number | null>(null);
  const [deleteConfirmRole, setDeleteConfirmRole] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { data: users, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data || res.data;
    },
  });

  const { data: roles, isLoading: rolesLoading, error: rolesError } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data.data || res.data;
    },
  });

  const { data: permissions } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await api.get('/permissions');
      return res.data.data || res.data;
    },
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: '',
    },
  });

  const roleForm = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      permissions: [],
    },
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => api.post('/users', data),
    onSuccess: () => {
      toast.success('تم إنشاء المستخدم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAddUserModalOpen(false);
      userForm.reset();
    },
    onError: () => toast.error('فشل إنشاء المستخدم'),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UserFormData }) => 
      api.put(`/users/${id}`, data),
    onSuccess: () => {
      toast.success('تم تحديث المستخدم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUserModalOpen(false);
      setEditingUser(null);
    },
    onError: () => toast.error('فشل تحديث المستخدم'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('تم حذف المستخدم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirmUser(null);
    },
    onError: () => toast.error('فشل حذف المستخدم'),
  });

  // Role mutations
  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleFormData) => api.post('/roles', data),
    onSuccess: () => {
      toast.success('تم إنشاء الدور بنجاح');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setAddRoleModalOpen(false);
      roleForm.reset();
    },
    onError: () => toast.error('فشل إنشاء الدور'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RoleFormData }) => 
      api.put(`/roles/${id}`, data),
    onSuccess: () => {
      toast.success('تم تحديث الدور بنجاح');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditRoleModalOpen(false);
      setEditingRole(null);
    },
    onError: () => toast.error('فشل تحديث الدور'),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      toast.success('تم حذف الدور بنجاح');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteConfirmRole(null);
    },
    onError: () => toast.error('فشل حذف الدور'),
  });

  const openEditUser = (user: User) => {
    setEditingUser(user);
    userForm.reset({
      name: user.name,
      email: user.email,
      password: '',
      password_confirmation: '',
      role: user.role,
    });
    setEditUserModalOpen(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    roleForm.reset({
      name: role.name,
      permissions: role.permissions,
    });
    setEditRoleModalOpen(true);
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  const isLoading = usersLoading || rolesLoading;

  if (usersError || rolesError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">فشل تحميل المستخدمين</h3>
        <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل البيانات</p>
        <Button onClick={() => refetchUsers()}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          إدارة المستخدمين
        </h1>
        <p className="text-muted-foreground mt-1">
          إدارة المستخدمين والأدوار والصلاحيات
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            الأدوار
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="shadow-soft">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">قائمة المستخدمين</CardTitle>
                  <CardDescription>{users?.length || 0} مستخدم</CardDescription>
                </div>
                <Button
                  onClick={() => { userForm.reset(); setAddUserModalOpen(true); }}
                  className="gap-2 bg-indigo-500 hover:bg-indigo-600"
                >
                  <Plus className="h-4 w-4" />
                  إضافة مستخدم
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">المستخدم</TableHead>
                      <TableHead className="font-semibold">البريد الإلكتروني</TableHead>
                      <TableHead className="font-semibold">الدور</TableHead>
                      <TableHead className="font-semibold">تاريخ التسجيل</TableHead>
                      <TableHead className="font-semibold text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {users?.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          transition={{ delay: index * 0.05 }}
                          className="group border-b border-border/50 hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 flex items-center justify-center">
                                <UserCircle className="h-5 w-5 text-indigo-500" />
                              </div>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20">
                              <Shield className="h-3 w-3 ml-1" />
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(user.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                                onClick={() => openEditUser(user)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteConfirmUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <Card className="shadow-soft">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">قائمة الأدوار</CardTitle>
                  <CardDescription>{roles?.length || 0} دور</CardDescription>
                </div>
                <Button
                  onClick={() => { roleForm.reset(); setAddRoleModalOpen(true); }}
                  className="gap-2 bg-indigo-500 hover:bg-indigo-600"
                >
                  <Plus className="h-4 w-4" />
                  إضافة دور
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">اسم الدور</TableHead>
                    <TableHead className="font-semibold">الصلاحيات</TableHead>
                    <TableHead className="font-semibold">المستخدمين</TableHead>
                    <TableHead className="font-semibold text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {roles?.map((role, index) => (
                      <motion.tr
                        key={role.id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ delay: index * 0.05 }}
                        className="group border-b border-border/50 hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-indigo-500" />
                            </div>
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((p) => (
                              <Badge key={p} variant="secondary" className="text-xs">
                                {p}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {role.users_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                              onClick={() => openEditRole(role)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteConfirmRole(role.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit User Modal */}
      <Dialog open={addUserModalOpen || editUserModalOpen} onOpenChange={(open) => {
        if (!open) {
          setAddUserModalOpen(false);
          setEditUserModalOpen(false);
          setEditingUser(null);
          userForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-indigo-500" />
              {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'قم بتعديل بيانات المستخدم' : 'أدخل بيانات المستخدم الجديد'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={userForm.handleSubmit((values) => {
            if (editingUser) {
              updateUserMutation.mutate({ id: editingUser.id, data: values });
            } else {
              createUserMutation.mutate(values);
            }
          })} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل *</Label>
              <Input
                id="name"
                placeholder="أدخل الاسم"
                {...userForm.register('name')}
                className={userForm.formState.errors.name ? 'border-destructive' : ''}
              />
              {userForm.formState.errors.name && (
                <p className="text-sm text-destructive">{userForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                {...userForm.register('email')}
                className={userForm.formState.errors.email ? 'border-destructive' : ''}
              />
              {userForm.formState.errors.email && (
                <p className="text-sm text-destructive">{userForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>الدور *</Label>
              <Select
                value={userForm.watch('role')}
                onValueChange={(value) => userForm.setValue('role', value)}
              >
                <SelectTrigger className={userForm.formState.errors.role ? 'border-destructive' : ''}>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                كلمة المرور {editingUser ? '(اتركها فارغة للإبقاء)' : '*'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...userForm.register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">تأكيد كلمة المرور</Label>
              <Input
                id="password_confirmation"
                type="password"
                placeholder="••••••••"
                {...userForm.register('password_confirmation')}
              />
              {userForm.formState.errors.password_confirmation && (
                <p className="text-sm text-destructive">
                  {userForm.formState.errors.password_confirmation.message}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setAddUserModalOpen(false);
                setEditUserModalOpen(false);
              }}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                {(createUserMutation.isPending || updateUserMutation.isPending) && (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                )}
                {editingUser ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Role Modal */}
      <Dialog open={addRoleModalOpen || editRoleModalOpen} onOpenChange={(open) => {
        if (!open) {
          setAddRoleModalOpen(false);
          setEditRoleModalOpen(false);
          setEditingRole(null);
          roleForm.reset();
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" />
              {editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingRole ? 'قم بتعديل الدور والصلاحيات' : 'أدخل اسم الدور واختر الصلاحيات'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={roleForm.handleSubmit((values) => {
            if (editingRole) {
              updateRoleMutation.mutate({ id: editingRole.id, data: values });
            } else {
              createRoleMutation.mutate(values);
            }
          })} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role_name">اسم الدور *</Label>
              <Input
                id="role_name"
                placeholder="مثال: محاسب"
                {...roleForm.register('name')}
                className={roleForm.formState.errors.name ? 'border-destructive' : ''}
              />
              {roleForm.formState.errors.name && (
                <p className="text-sm text-destructive">{roleForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>الصلاحيات</Label>
              <ScrollArea className="h-60 rounded-md border p-4">
                {!permissions || permissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">لا توجد صلاحيات متاحة</p>
                    <p className="text-xs mt-1">يرجى تشغيل php artisan db:seed</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {permissions.map((permission) => (
                      <div key={permission.name} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={permission.name}
                          checked={roleForm.watch('permissions').includes(permission.name)}
                          onCheckedChange={(checked) => {
                            const current = roleForm.watch('permissions');
                            if (checked) {
                              roleForm.setValue('permissions', [...current, permission.name]);
                            } else {
                              roleForm.setValue('permissions', current.filter(p => p !== permission.name));
                            }
                          }}
                        />
                        <label
                          htmlFor={permission.name}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setAddRoleModalOpen(false);
                setEditRoleModalOpen(false);
              }}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                {(createRoleMutation.isPending || updateRoleMutation.isPending) && (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                )}
                {editingRole ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <Dialog open={deleteConfirmUser !== null} onOpenChange={() => setDeleteConfirmUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">تأكيد حذف المستخدم</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmUser(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmUser && deleteUserMutation.mutate(deleteConfirmUser)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation */}
      <Dialog open={deleteConfirmRole !== null} onOpenChange={() => setDeleteConfirmRole(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">تأكيد حذف الدور</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmRole(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmRole && deleteRoleMutation.mutate(deleteConfirmRole)}
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
