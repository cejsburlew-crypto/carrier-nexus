<?php
class DB {
  private static ?PDO $conn = null;
  public static function conn(): PDO {
    if (self::$conn === null) {
      $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4',
        getenv('DB_HOST') ?: 'localhost',
        getenv('DB_NAME') ?: 'carrier_nexus'
      );
      self::$conn = new PDO($dsn,
        getenv('DB_USER') ?: 'nexus_user',
        getenv('DB_PASS') ?: 'nexus_secret',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
      );
    }
    return self::$conn;
  }
}
