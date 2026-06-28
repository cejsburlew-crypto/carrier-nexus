<?php require_once __DIR__.'/../../config/config.php';
$p = require_auth();
$header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token  = substr($header, 7);
DB::conn()->prepare('DELETE FROM auth_tokens WHERE token=?')->execute([$token]);
ok(null, 'Logged out');
