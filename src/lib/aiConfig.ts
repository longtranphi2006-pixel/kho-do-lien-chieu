import { isSupabaseConfigured, supabase } from './supabase';

export interface AiModerationConfig {
  // 1. Toggles for core rules
  blockCommercial: boolean;
  blockProhibitedGoods: boolean;
  blockFoodFresh: boolean;
  blockPrescriptionDrugs: boolean;
  blockCosmeticsOpen: boolean;
  blockPhoneAndBankingInImage: boolean;
  blockStockImages: boolean;
  requireStudentUsefulness: boolean;

  // 2. Custom rules & guidelines (Text written by Admin)
  customRules: string;

  // 3. Blacklist keywords
  customBlacklist: string[];

  // 4. Thresholds
  autoApproveConfidence: number; // 50 to 95 (%)

  // 5. Metadata
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_AI_CONFIG: AiModerationConfig = {
  blockCommercial: true,
  blockProhibitedGoods: true,
  blockFoodFresh: true,
  blockPrescriptionDrugs: true,
  blockCosmeticsOpen: true,
  blockPhoneAndBankingInImage: true,
  blockStockImages: false,
  requireStudentUsefulness: true,
  customRules: `1. Đồ dùng phải còn giá trị sử dụng thực tế cho sinh viên (sách vở, giáo trình, quạt, bàn ghế, đồ gia dụng, quần áo...).
2. Tuyệt đối không cho tặng hoặc đổi các loại tài liệu thi cử nội bộ trái phép.
3. Nếu là đồ điện tử (quạt, bàn ủi, ấm đun nước...), người cho tặng cam kết thiết bị còn hoạt động an toàn, không bị chập điện.`,
  customBlacklist: [
    'bán lại',
    'thanh lý giá',
    'giá chỉ',
    'tiền mặt',
    'chuyển khoản',
    'inbox báo giá',
    'mặc cả',
    'vũ khí',
    'súng',
    'đạn',
    'dao bấm',
    'thuốc lá',
    'vape',
    'pod',
    'cần sa',
    'ma túy',
  ],
  autoApproveConfidence: 85,
  updatedAt: new Date().toISOString(),
  updatedBy: 'Ban Quản Trị',
};

const STORAGE_KEY = 'kdlc_ai_moderation_config_v1';

/**
 * Fetch current AI Moderation rules (from Supabase or localStorage fallback)
 */
export async function getAiModerationConfig(): Promise<AiModerationConfig> {
  // 1. Try Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('address')
        .eq('id', 'sys-ai-rules')
        .maybeSingle();

      if (!error && data?.address) {
        const parsed = JSON.parse(data.address);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_AI_CONFIG, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to fetch AI config from Supabase:', e);
    }
  }

  // 2. Try localStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_AI_CONFIG, ...JSON.parse(saved) };
      }
    } catch {}
  }

  return DEFAULT_AI_CONFIG;
}

/**
 * Save updated AI Moderation rules to Supabase and localStorage
 */
export async function saveAiModerationConfig(
  config: AiModerationConfig,
  adminName: string = 'Ban Quản Trị'
): Promise<boolean> {
  const updated: AiModerationConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: adminName,
  };

  const payloadString = JSON.stringify(updated);

  // 1. Save to Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: 'sys-ai-rules',
        full_name: 'Cấu hình AI Kiểm Duyệt',
        role: 'admin',
        address: payloadString,
      });
      if (error) {
        console.warn('Supabase save AI config error:', error);
      }
    } catch (e) {
      console.warn('Supabase save AI config exception:', e);
    }
  }

  // 2. Save to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, payloadString);
    } catch {}
  }

  return true;
}
