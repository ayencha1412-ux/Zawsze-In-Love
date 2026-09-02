<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
class EnsureSharedSpaceMember { public function handle(Request $request, Closure $next): Response { $user=$request->user(); if(!$user) abort(401); $space=$user->spaces()->first(); if(!$space) abort(403,'This account is not connected to the Zawsze shared space.'); $request->attributes->set('zawsze_space',$space); return $next($request); } }
