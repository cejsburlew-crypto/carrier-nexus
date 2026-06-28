<?php require_once __DIR__.'/../../config/config.php';
$p = require_auth(); $co = company_scope($p); $db = DB::conn();
$method = $_SERVER['REQUEST_METHOD'];
$id = (int)(explode('?',$_SERVER['REQUEST_URI'])[0] === '' ? 0 : array_reverse(explode('/', explode('?',$_SERVER['REQUEST_URI'])[0]))[0]);

if ($method === 'GET') {
  if ($id > 0) {
    $s = $db->prepare('SELECT l.*, d.name driver_name FROM loads l LEFT JOIN drivers d ON d.id=l.driver_id WHERE l.id=? AND l.company_id=?');
    $s->execute([$id,$co]); $row=$s->fetch(); if(!$row) err('Not found',404); ok($row);
  }
  $page=max(1,(int)q('page',1)); $per=min(100,(int)q('per_page',25)); $offset=($page-1)*$per;
  $where='WHERE l.company_id=?'; $params=[$co];
  if(q('status')) { $where.=' AND l.status=?'; $params[]=q('status'); }
  if(q('driver_id')) { $where.=' AND l.driver_id=?'; $params[]=q('driver_id'); }
  if(q('week_start')) { $where.=' AND l.week_start=?'; $params[]=q('week_start'); }
  $total=$db->prepare("SELECT COUNT(*) FROM loads l $where"); $total->execute($params);
  $rows =$db->prepare("SELECT l.*,d.name driver_name FROM loads l LEFT JOIN drivers d ON d.id=l.driver_id $where ORDER BY l.pickup_date DESC LIMIT $per OFFSET $offset"); $rows->execute($params);
  paged($rows->fetchAll(),(int)$total->fetchColumn(),$page,$per);
}
if ($method === 'POST') {
  $b=body(); $required=['rate'];
  foreach($required as $f) if(empty($b[$f])) err("$f is required");
  $week = !empty($b['pickup_date']) ? date('Y-m-d', strtotime('monday this week', strtotime($b['pickup_date']))) : null;
  $s=$db->prepare('INSERT INTO loads (company_id,dispatcher_id,driver_id,rate_con_number,broker_name,broker_mc,shipper_name,consignee_name,origin_city,origin_state,dest_city,dest_state,pickup_date,delivery_date,commodity,weight,rate,fuel_surcharge,accessorials,status,week_start,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  $s->execute([$co,$p['user_id'],$b['driver_id']??null,$b['rate_con_number']??null,$b['broker_name']??null,$b['broker_mc']??null,$b['shipper_name']??null,$b['consignee_name']??null,$b['origin_city']??null,$b['origin_state']??null,$b['dest_city']??null,$b['dest_state']??null,$b['pickup_date']??null,$b['delivery_date']??null,$b['commodity']??null,$b['weight']??null,$b['rate'],$b['fuel_surcharge']??0,$b['accessorials']??0,$b['status']??'pending',$week,$b['notes']??null]);
  $id=$db->lastInsertId();
  $row=$db->prepare('SELECT * FROM loads WHERE id=?'); $row->execute([$id]); ok($row->fetch(),201);
}
if ($method === 'PUT' && $id > 0) {
  $b=body(); $sets=[]; $vals=[];
  foreach(['driver_id','status','notes','rate','pickup_date','delivery_date'] as $f) if(array_key_exists($f,$b)) { $sets[]="$f=?"; $vals[]=$b[$f]; }
  if(empty($sets)) err('Nothing to update');
  $vals[]=$id; $vals[]=$co;
  $db->prepare('UPDATE loads SET '.implode(',',$sets).' WHERE id=? AND company_id=?')->execute($vals);
  ok(['id'=>$id],'Updated');
}
if ($method === 'DELETE' && $id > 0) {
  $db->prepare('DELETE FROM loads WHERE id=? AND company_id=?')->execute([$id,$co]); ok(null,'Deleted');
}
err('Not found',404);
