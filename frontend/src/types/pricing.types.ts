// ──────────────────────────────────────────
// Pricing & Imposition Module Types
// جميع الأبعاد بالسنتيمتر (سم)
// ──────────────────────────────────────────

export interface PaperType {
  id: number;
  name: string;
  category: 'coated' | 'uncoated' | 'cardboard' | 'special';
  weight_gsm: number;
  price_per_sheet: number | null;
  price_per_kg: number | null;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type SheetSizeCategory = 'quarter_sheet' | 'half_sheet' | 'full_sheet';

export interface SheetSize {
  id: number;
  name: string;
  category: SheetSizeCategory;
  width_cm: number;
  height_cm: number;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FinishingOperation {
  id: number;
  name: string;
  pricing_type: 'per_piece' | 'per_sheet' | 'fixed' | 'per_fold' | 'per_cut';
  cost: number;
  min_cost: number | null;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PricingConfiguration {
  id: number;
  digital_cost_per_click_bw: number;
  digital_cost_per_click_color: number;
  digital_min_charge: number;
  offset_ctp_cost_per_plate: number;
  offset_setup_cost: number;
  offset_cost_per_1000_sheets: number;
  offset_min_sheets: number;
  gripper_margin_cm: number;
  item_gap_cm: number;
  default_bleed_cm: number;
  default_waste_percentage: number;
  default_margin_percentage: number;
  min_text_size_pt: number;
  min_image_dpi: number;
  max_shrink_cm: number;
  // Machine settings
  machine_max_width_cm: number;
  machine_max_height_cm: number;
  makeready_waste_sheets: number;
  run_waste_percentage: number;
  created_at?: string;
  updated_at?: string;
}

// ──────────────────────────────────────────
// Layout Coordinate Types (for SVG rendering)
// ──────────────────────────────────────────

export interface LayoutCoordinate {
  x: number;
  y: number;
  w: number;
  h: number;
  col: number;
  row: number;
}

export interface LayoutData {
  machine_sheet: {
    width_cm: number;
    height_cm: number;
    gripper_margin_cm: number;
  };
  item: {
    product_width_cm: number;
    product_height_cm: number;
    bleed_cm: number;
    total_width_cm: number;
    total_height_cm: number;
  };
  grid: {
    cols: number;
    rows: number;
    count: number;
    orientation: 'normal' | 'rotated';
    width_cm: number;
    height_cm: number;
    offset_x: number;
    offset_y: number;
  };
  coordinates: LayoutCoordinate[];
  waste: {
    right_cm: number;
    bottom_cm: number;
  };
  parent_sheet_cutting: {
    parent_width_cm: number;
    parent_height_cm: number;
    cuts_across: number;
    cuts_down: number;
    machine_sheets_per_parent: number;
    cutting_layout: string;
  };
}

export type ColorMode = '1/0' | '1/1' | '2/0' | '2/2' | '4/0' | '4/4';

export interface PriceCalculationInput {
  product_name?: string;
  product_width_cm: number;
  product_height_cm: number;
  quantity: number;
  num_pages?: number;
  color_front?: ColorMode;
  color_back?: ColorMode | null;
  bleed_cm?: number;
  paper_type_id?: number | null;
  sheet_size_ids?: number[];
  finishing_operation_ids?: number[];
  allow_shrink?: boolean;
  margin_percentage?: number;
  waste_percentage?: number;
  has_text?: boolean;
  min_font_size?: number | null;
  has_images?: boolean;
  image_dpi?: number | null;
  has_folding?: boolean;
  has_binding?: boolean;
  has_die_cutting?: boolean;
  customer_id?: number | null;
  notes?: string | null;
}

export interface QualityWarning {
  type: string;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  message_en: string;
}

export interface ImpositionOption {
  option_rank: number;
  sheet_size_id: number | null;
  sheet_size_name: string;
  sheet_size_category: string | null;
  sheet_width_cm: number;
  sheet_height_cm: number;
  orientation: 'normal' | 'rotated';
  cols: number;
  rows: number;
  items_per_sheet: number;
  total_sheets: number;
  // Three-level hierarchy fields
  machine_sheets_per_parent: number;
  parent_sheets_needed: number;
  waste_sheets: number;
  net_machine_sheets?: number;
  total_machine_sheets?: number;
  makeready_waste_sheets?: number;
  run_waste_sheets?: number;
  impressions?: number;
  total_plates?: number;
  front_plates?: number;
  back_plates?: number;
  // Layout
  sheet_utilization: number;
  is_shrink_used: boolean;
  shrink_width_cm: number;
  shrink_height_cm: number;
  final_width_cm: number;
  final_height_cm: number;
  layout_data: LayoutData | null;
  // Costs
  paper_cost: number;
  printing_cost: number;
  setup_cost: number;
  waste_cost: number;
  finishing_cost: number;
  total_cost: number;
  cost_per_unit: number;
  cost_saving_amount: number;
  cost_saving_percent: number;
  production_method: 'digital' | 'offset';
  warnings: QualityWarning[];
  explanation: string;
}

export interface PricingRecommendation {
  method: 'digital' | 'offset' | 'both';
  reason: string;
  reason_en: string;
}

export interface PricingSummary {
  total_cost: number;
  cost_per_unit: number;
  margin_percentage: number;
  selling_price: number;
  selling_price_per_unit: number;
}

export interface PriceCalculationResult {
  input_summary: {
    product_name: string;
    product_width_cm: number;
    product_height_cm: number;
    quantity: number;
    num_pages: number;
    color_front: string;
    color_back: string | null;
    bleed_cm: number;
    paper_type: PaperType | null;
    finishing_operations: FinishingOperation[];
  };
  recommendation: PricingRecommendation;
  pricing_summary: PricingSummary;
  options: ImpositionOption[];
  warnings: QualityWarning[];
  digital_cost: number;
  best_offset_cost: number | null;
}

export interface PriceCalculation {
  id: number;
  customer_id: number | null;
  product_name: string;
  product_width_cm: number;
  product_height_cm: number;
  quantity: number;
  num_pages: number;
  color_front: string;
  color_back: string | null;
  bleed_cm: number;
  has_folding: boolean;
  has_binding: boolean;
  has_die_cutting: boolean;
  has_text: boolean;
  min_font_size: number | null;
  has_images: boolean;
  image_dpi: number | null;
  paper_type_id: number | null;
  finishing_operations: number[];
  recommended_method: 'digital' | 'offset' | 'both' | null;
  recommendation_reason: string | null;
  total_cost: number | null;
  cost_per_unit: number | null;
  selling_price: number | null;
  margin_percentage: number | null;
  selected_option_index: number | null;
  warnings: QualityWarning[] | null;
  notes: string | null;
  status: 'draft' | 'approved' | 'converted';
  created_by: number | null;
  created_at: string;
  updated_at: string;
  customer?: import('./index').Customer;
  paper_type?: PaperType;
  options?: ImpositionOption[];
}
