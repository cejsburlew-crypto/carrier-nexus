<?php
require_once __DIR__ . '/config/config.php';

$uri    = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$parts  = explode('/', $uri);
$route  = $parts[1] ?? '';   // e.g. "loads", "drivers"
$sub    = $parts[2] ?? '';   // e.g. "leaderboard", specific id

// Route map
$routes = [
  'auth/login'             => 'api/auth/login.php',
  'auth/logout'            => 'api/auth/logout.php',
  'auth/switch-company'    => 'api/auth/switch-company.php',
  'dashboard/stats'        => 'api/dashboard/stats.php',
  'dashboard/fleet-command'=> 'api/dashboard/stats.php',
  'loads'                  => 'api/loads/index.php',
  'drivers/leaderboard'    => 'api/drivers/leaderboard.php',
  'drivers'                => 'api/drivers/index.php',
  'settlements'            => 'api/settlements/index.php',
  'equipment'              => 'api/equipment/index.php',
  'expenses'               => 'api/expenses/index.php',
  'documents'              => 'api/documents/index.php',
  'maintenance_records'    => 'api/maintenance_records/index.php',
  'work_orders'            => 'api/work_orders/index.php',
  'permits'                => 'api/permits/index.php',
  'coaching-sessions'      => 'api/coaching_sessions/index.php',
  'drug-tests'             => 'api/drug_tests/index.php',
  'companies'              => 'api/companies/index.php',
  'hazard-reports'         => 'api/hazard_reports/index.php',
];

$key = is_numeric($sub) ? $route : "$route/$sub";
if (array_key_exists($key, $routes)) {
  $file = __DIR__ . '/' . $routes[$key];
  if (file_exists($file)) { require $file; exit; }
}
if (array_key_exists($route, $routes)) {
  $file = __DIR__ . '/' . $routes[$route];
  if (file_exists($file)) { require $file; exit; }
}
http_response_code(404);
echo json_encode(['success'=>false,'message'=>"Route not found: $route/$sub"]);
