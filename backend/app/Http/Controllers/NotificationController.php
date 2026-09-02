<?php

namespace App\Http\Controllers;

use App\Models\ZawszeNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = ZawszeNotification::where('user_id', $request->user()->id)
            ->latest()->limit(60)->get();

        return response()->json($items->map(fn (ZawszeNotification $item) => [
            'id' => $item->id,
            'type' => $item->type,
            'message' => $item->message,
            'data' => $item->data,
            'readAt' => optional($item->read_at)->toISOString(),
            'createdAt' => optional($item->created_at)->toISOString(),
        ])->values());
    }

    public function read(Request $request): JsonResponse
    {
        ZawszeNotification::where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['ok' => true]);
    }
}
