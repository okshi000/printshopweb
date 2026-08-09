<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json([
            'status' => 'success',
            'data' => $settings
        ]);
    }

    public function update(Request $request)
    {
        // Update regular settings
        $data = $request->except(['company_stamp', 'company_logo']);
        
        foreach ($data as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        // Handle file uploads
        if ($request->hasFile('company_stamp')) {
            $path = $request->file('company_stamp')->store('settings', 'public');
            Setting::updateOrCreate(['key' => 'company_stamp'], ['value' => '/storage/' . $path]);
        }

        if ($request->hasFile('company_logo')) {
            $path = $request->file('company_logo')->store('settings', 'public');
            Setting::updateOrCreate(['key' => 'company_logo'], ['value' => '/storage/' . $path]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم حفظ الإعدادات بنجاح',
            'data' => Setting::all()->pluck('value', 'key')
        ]);
    }
}
