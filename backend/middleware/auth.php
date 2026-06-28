<?php
function jwt_encode(array $payload): string {
  $h = base64_url_encode(json_encode(['alg'=>'HS256','typ'=>'JWT']));
  $p = base64_url_encode(json_encode($payload));
  $s = base64_url_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
  return "$h.$p.$s";
}
function jwt_decode(string $token): ?array {
  [$h,$p,$s] = explode('.', $token) + [null,null,null];
  if (!$h||!$p||!$s) return null;
  $valid = base64_url_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
  if (!hash_equals($valid, $s)) return null;
  $payload = json_decode(base64_url_decode($p), true);
  if (!$payload || $payload['exp'] < time()) return null;
  return $payload;
}
function base64_url_encode(string $data): string { return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); }
function base64_url_decode(string $data): string { return base64_decode(strtr($data, '-_', '+/')); }

function require_auth(): array {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  $token  = str_starts_with($header, 'Bearer ') ? substr($header, 7) : null;
  if (!$token) err('Unauthenticated', 401);
  $payload = jwt_decode($token);
  if (!$payload) err('Token invalid or expired', 401);
  return $payload;
}
function require_role(array $payload, string ...$roles): void {
  if (!in_array($payload['role'], $roles, true)) err('Forbidden', 403);
}
function company_scope(array $payload): int { return (int)$payload['company_id']; }
