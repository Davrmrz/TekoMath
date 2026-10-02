<?php
// services/youtube_service.php - Catálogo y búsqueda de videos educativos reales de trigonometría y matemáticas
class YouTubeService {
    
    private static array $curatedVideos = [
        'circunferencia' => [
            'title' => 'Circunferencia Trigonométrica Explicada Fácil',
            'video_id' => '1m92G0X9390',
            'embed_url' => 'https://www.youtube.com/embed/1m92G0X9390',
            'lang' => 'es'
        ],
        'seno_coseno' => [
            'title' => 'Signos de las Funciones Trigonométricas por Cuadrante',
            'video_id' => 'k3_g0Hw7M2Y',
            'embed_url' => 'https://www.youtube.com/embed/k3_g0Hw7M2Y',
            'lang' => 'es'
        ],
        'amplitud_periodo' => [
            'title' => 'Gráfica de Funciones Trigonométricas: Amplitud y Período',
            'video_id' => '9qJ1_q7Z8Z0',
            'embed_url' => 'https://www.youtube.com/embed/9qJ1_q7Z8Z0',
            'lang' => 'es'
        ],
        'unit_circle_en' => [
            'title' => 'The Unit Circle Explained (Trigonometry Basics)',
            'video_id' => 'cIVpemcoRqg',
            'embed_url' => 'https://www.youtube.com/embed/cIVpemcoRqg',
            'lang' => 'en'
        ]
    ];

    public static function findVideo(string $query, string $lang = 'es'): array {
        $q = strtolower($query);
        
        if (str_contains($q, 'inglés') || str_contains($q, 'english') || $lang === 'en') {
            $video = self::$curatedVideos['unit_circle_en'];
        } elseif (str_contains($q, 'amplitud') || str_contains($q, 'periodo') || str_contains($q, 'gráfica')) {
            $video = self::$curatedVideos['amplitud_periodo'];
        } elseif (str_contains($q, 'signo') || str_contains($q, 'seno') || str_contains($q, 'coseno')) {
            $video = self::$curatedVideos['seno_coseno'];
        } else {
            $video = self::$curatedVideos['circunferencia'];
        }

        return [
            'success' => true,
            'video' => $video,
            'message_jopara' => "Kóva ha'e peteĩ video iporãva ({$video['title']}) para reforzar lo que vimos. Emañami hese:",
            'message_es' => "Este es un video excelente ({$video['title']}) para reforzar lo que vimos. Puedes revisarlo a continuación:"
        ];
    }
}
