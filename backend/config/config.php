<?php
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'nexus-jwt-secret-change-in-production');
define('JWT_TTL',    60 * 60 * 10); // 10 hours
define('API_VERSION','2.0.0');

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept');
header('Content-Type: application/json; charset=UTF-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/response.php';
