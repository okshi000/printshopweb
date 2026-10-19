<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. إنشاء جدول الأعمدة إذا لم يكن موجوداً
        if (!Schema::hasTable('kanban_columns')) {
            Schema::create('kanban_columns', function (Blueprint $table) {
                $table->id();
                $table->string('key', 50)->unique();
                $table->string('title', 100);
                $table->string('color', 50)->default('sky');
                $table->string('icon', 50)->default('Layers');
                $table->integer('sort_order')->default(0);
                $table->boolean('is_initial')->default(false);
                $table->boolean('is_final')->default(false);
                $table->timestamps();
            });
        }

        // 2. تعديل حقل status في جدول kanban_cards ليكون VARCHAR(50) بدلاً من ENUM
        try {
            DB::statement("ALTER TABLE kanban_cards MODIFY status VARCHAR(50) NOT NULL DEFAULT 'in_design'");
        } catch (\Throwable $e) {
            // في حال تم تعديلها مسبقاً
        }

        // 3. بذر المراحل الخمس الافتراضية
        $defaultColumns = [
            [
                'key' => 'in_design',
                'title' => 'في التصميم',
                'color' => 'sky',
                'icon' => 'Sparkles',
                'sort_order' => 1,
                'is_initial' => true,
                'is_final' => false,
            ],
            [
                'key' => 'in_printing',
                'title' => 'في الطباعة',
                'color' => 'indigo',
                'icon' => 'Package',
                'sort_order' => 2,
                'is_initial' => false,
                'is_final' => false,
            ],
            [
                'key' => 'in_finishing',
                'title' => 'في التشطيب',
                'color' => 'amber',
                'icon' => 'Layers',
                'sort_order' => 3,
                'is_initial' => false,
                'is_final' => false,
            ],
            [
                'key' => 'in_office',
                'title' => 'في المكتب (جاهز)',
                'color' => 'emerald',
                'icon' => 'Boxes',
                'sort_order' => 4,
                'is_initial' => false,
                'is_final' => false,
            ],
            [
                'key' => 'delivered',
                'title' => 'تم التسليم',
                'color' => 'slate',
                'icon' => 'CheckCircle2',
                'sort_order' => 5,
                'is_initial' => false,
                'is_final' => true,
            ],
        ];

        foreach ($defaultColumns as $col) {
            DB::table('kanban_columns')->updateOrInsert(
                ['key' => $col['key']],
                array_merge($col, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('kanban_columns');
    }
};
