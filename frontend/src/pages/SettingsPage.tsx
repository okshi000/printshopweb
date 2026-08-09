import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Image as ImageIcon, Building, Phone, MapPin, Stamp } from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi, SettingsData } from '../api/settings.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SettingsData>({
    company_name: '',
    company_phone: '',
    company_address: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);

  // Fetch settings
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsApi.getSettings();
      return res.data.data;
    },
  });

  useEffect(() => {
    if (data) {
      setFormData({
        company_name: data.company_name || '',
        company_phone: data.company_phone || '',
        company_address: data.company_address || '',
        company_logo: data.company_logo,
        company_stamp: data.company_stamp,
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (submitData: FormData) => {
      const res = await settingsApi.updateSettings(submitData);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'تم حفظ الإعدادات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setLogoFile(null);
      setStampFile(null);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append('company_name', formData.company_name || '');
    payload.append('company_phone', formData.company_phone || '');
    payload.append('company_address', formData.company_address || '');
    
    if (logoFile) {
      payload.append('company_logo', logoFile);
    }
    if (stampFile) {
      payload.append('company_stamp', stampFile);
    }

    updateMutation.mutate(payload);
  };

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    // Assuming API is at the same host or you have a backend URL
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
    return `${baseUrl}${path}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-xl">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">إعدادات النظام</h1>
          <p className="text-muted-foreground text-sm">إدارة بيانات الشركة، الشعار، والختم</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* General Information */}
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/40">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                البيانات الأساسية
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">اسم الشركة</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                    <Building className="h-4 w-4" />
                  </div>
                  <Input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="pr-10"
                    placeholder="أدخل اسم الشركة"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">رقم الهاتف</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                    <Phone className="h-4 w-4" />
                  </div>
                  <Input
                    type="text"
                    value={formData.company_phone}
                    onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                    className="pr-10"
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">العنوان</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <Input
                    type="text"
                    value={formData.company_address}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    className="pr-10"
                    placeholder="أدخل العنوان"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Media & Images */}
          <div className="space-y-6">
            {/* Logo */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/40">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  شعار الشركة (اللوجو)
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-24 h-24 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden">
                    {logoFile ? (
                      <img src={URL.createObjectURL(logoFile)} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    ) : formData.company_logo ? (
                      <img src={getImageUrl(formData.company_logo)} alt="Current Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">PNG, JPG أو SVG. الحجم الأقصى 2MB.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stamp */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/40">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Stamp className="h-5 w-5 text-primary" />
                  ختم الشركة
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-24 h-24 rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden">
                    {stampFile ? (
                      <img src={URL.createObjectURL(stampFile)} alt="Stamp Preview" className="max-w-full max-h-full object-contain" />
                    ) : formData.company_stamp ? (
                      <img src={getImageUrl(formData.company_stamp)} alt="Current Stamp" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <Stamp className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input 
                      type="file" 
                      accept="image/png"
                      onChange={(e) => setStampFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">صورة PNG فقط (يفضل بخلفية شفافة). الحجم الأقصى 2MB.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} className="gap-2 min-w-32">
            {updateMutation.isPending ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            حفظ الإعدادات
          </Button>
        </div>
      </form>
    </div>
  );
}
