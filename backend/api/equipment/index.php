<?php require_once __DIR__.'/../../config/config.php';
$p = require_auth(); $co = company_scope($p); $db = DB::conn();
$method = $_SERVER['REQUEST_METHOD'];
$parts = explode('/', trim(explode('?',$_SERVER['REQUEST_URI'])[0], '/'));
$id = is_numeric(end($parts)) ? (int)end($parts) : 0;

if ($method === 'GET') {
  if ($id > 0) {
    $s = $db->prepare('SELECT * FROM equipment WHERE id=? AND company_id=?');
    $s->execute([$id,$co]); $row=$s->fetch(); if(!$row) err('Not found',404); ok($row);
  }
  $page=max(1,(int)q('page',1)); $per=min(100,(int)q('per_page',25)); $offset=($page-1)*$per;
  $total=$db->prepare('SELECT COUNT(*) FROM equipment WHERE company_id=?'); $total->execute([$co]);
  $rows=$db->prepare('SELECT * FROM equipment WHERE company_id=? ORDER BY id DESC LIMIT '.$per.' OFFSET '.$offset); $rows->execute([$co]);
  paged($rows->fetchAll(),(int)$total->fetchColumn(),$page,$per);
}
if ($method === 'POST') {
  $b=body();
  // Build dynamic insert from body (sanitized)
  $allowed = array_keys($db->query('DESCRIBE equipment')->fetchAll(PDO::FETCH_KEY_PAIR));
  $fields=['company_id']; $vals=[$co];
  foreach($b as $k=>$v) if(in_array($k,$allowed)&&$k!=='id'&&$k!=='company_id'&&$k!=='created_at'&&$k!=='updated_at'&&$k!=='net_pay'&&$k!=='total_cost') { $fields[]=$k; $vals[]=$v; }
  if(count($fields)<2) err('No valid fields');
  $sql='INSERT INTO equipment ('.implode(',',$fields).') VALUES ('.implode(',',array_fill(0,count($fields),'?')).')';
  $db->prepare($sql)->execute($vals); $newId=$db->lastInsertId();
  $row=$db->prepare('SELECT * FROM equipment WHERE id=?'); $row->execute([$newId]); ok($row->fetch(),'Created',201);
}
if ($method === 'PUT' && $id > 0) {
  $b=body(); $sets=[]; $vals=[];
  $allowed = array_keys($db->query('DESCRIBE equipment')->fetchAll(PDO::FETCH_KEY_PAIR));
  foreach($b as $k=>$v) if(in_array($k,$allowed)&&$k!=='id'&&$k!=='company_id'&&$k!=='created_at') { $sets[]="$k=?"; $vals[]=$v; }
  if(empty($sets)) err('Nothing to update');
  $vals[]=$id; $vals[]=$co;
  $db->prepare('UPDATE equipment SET '.implode(',',$sets).' WHERE id=? AND company_id=?')->execute($vals);
  ok(['id'=>$id],'Updated');
}
if ($method === 'DELETE' && $id > 0) {
  $db->prepare('DELETE FROM equipment WHERE id=? AND company_id=?')->execute([$id,$co]); ok(null,'Deleted');
}
err('Method not allowed',405);
