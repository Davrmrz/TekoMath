<?php
// api/youtube.php - Endpoint para obtención de videos educativos
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../services/youtube_service.php';

$query = $_GET['q'] ?? '';
$lang = $_GET['lang'] ?? 'es';

$result = YouTubeService::findVideo($query, $lang);
echo json_encode($result, JSON_UNESCAPED_UNICODE);