<?php require_once __DIR__.'/../../config/config.php';
$p = require_auth(); $co = company_scope($p); $db = DB::conn();
$s = $db->prepare('SELECT id,name,loads_completed,miles_driven,on_time_pct FROM drivers WHERE company_id=? AND active=1 ORDER BY loads_completed DESC, miles_driven DESC LIMIT 20');
$s->execute([$co]); ok($s->fetchAll());
