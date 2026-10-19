<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class KanbanColumn extends Model
{
    protected $table = 'kanban_columns';

    protected $fillable = [
        'key',
        'title',
        'color',
        'icon',
        'sort_order',
        'is_initial',
        'is_final',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_initial' => 'boolean',
        'is_final' => 'boolean',
    ];

    public function cards(): HasMany
    {
        return $this->hasMany(KanbanCard::class, 'status', 'key');
    }

    public static function getInitialStageKey(): string
    {
        return self::where('is_initial', true)->value('key')
            ?? self::orderBy('sort_order', 'asc')->value('key')
            ?? 'in_design';
    }

    public static function getFinalStageKeys(): array
    {
        $keys = self::where('is_final', true)->pluck('key')->toArray();
        return !empty($keys) ? $keys : ['delivered'];
    }

    public static function generateUniqueKey(string $title): string
    {
        $ascii = Str::slug(Str::ascii($title), '_');
        if (empty($ascii) || $ascii === '_') {
            $ascii = 'stage_' . substr(md5($title . microtime()), 0, 8);
        }

        $slug = $ascii;
        $counter = 1;
        while (self::where('key', $slug)->exists()) {
            $slug = "{$ascii}_{$counter}";
            $counter++;
        }

        return $slug;
    }
}
