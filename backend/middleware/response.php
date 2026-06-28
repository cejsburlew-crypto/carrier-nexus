<?php
function ok($data = null, string $message = 'Success', int $code = 200): void {
  http_response_code($code);
  echo json_encode(['success' => true, 'data' => $data, 'message' => $message]);
  exit;
}
function err(string $message, int $code = 400, array $errors = []): void {
  http_response_code($code);
  echo json_encode(['success' => false, 'message' => $message, 'errors' => $errors]);
  exit;
}
function paged(array $data, int $total, int $page, int $perPage): void {
  ok(['data' => $data, 'total' => $total, 'page' => $page, 'per_page' => $perPage, 'last_page' => (int)ceil($total / $perPage)]);
}
function body(): array { return json_decode(file_get_contents('php://input'), true) ?? []; }
function q(string $key, $default = null) { return $_GET[$key] ?? $default; }
