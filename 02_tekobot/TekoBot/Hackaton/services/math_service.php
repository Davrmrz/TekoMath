<?php
// services/math_service.php - Motor matemático analítico y clasificador de errores trigonométricos

class MathService {
    
    /**
     * Normaliza un ángulo al rango [0, 360)
     */
    public static function normalizeAngle(float $deg): float {
        $deg = fmod($deg, 360.0);
        if ($deg < 0) {
            $deg += 360.0;
        }
        return $deg;
    }

    /**
     * Determina el cuadrante de un ángulo en grados
     * Retorna: 'I', 'II', 'III', 'IV' o 'axial' (sobre los ejes 0, 90, 180, 270)
     */
    public static function getQuadrant(float $deg): string {
        $deg = self::normalizeAngle($deg);
        if ($deg == 0 || $deg == 90 || $deg == 180 || $deg == 270) {
            return 'axial';
        }
        if ($deg > 0 && $deg < 90) return 'I';
        if ($deg > 90 && $deg < 180) return 'II';
        if ($deg > 180 && $deg < 270) return 'III';
        return 'IV';
    }

    /**
     * Calcula el ángulo de referencia (ángulo agudo positivo con el eje X)
     */
    public static function getReferenceAngle(float $deg): float {
        $deg = self::normalizeAngle($deg);
        $quadrant = self::getQuadrant($deg);
        
        switch ($quadrant) {
            case 'I': return $deg;
            case 'II': return 180.0 - $deg;
            case 'III': return $deg - 180.0;
            case 'IV': return 360.0 - $deg;
            default:
                if ($deg == 0 || $deg == 180) return 0.0;
                return 90.0;
        }
    }

    /**
     * Convierte grados a radianes (expresión simplificada con pi)
     */
    public static function degToRadExpression(float $deg): string {
        $deg = self::normalizeAngle($deg);
        if ($deg == 0) return "0 rad";
        if ($deg == 180) return "\\pi \\text{ rad}";
        if ($deg == 360) return "2\\pi \\text{ rad}";
        
        // Buscar mcd
        $gcd = self::gcd((int)$deg, 180);
        $num = (int)$deg / $gcd;
        $den = 180 / $gcd;

        if ($den == 1) {
            return ($num == 1 ? "" : $num) . "\\pi \\text{ rad}";
        }
        $numStr = ($num == 1) ? "\\pi" : "{$num}\\pi";
        return "\\frac{{$numStr}}{{$den}} \\text{ rad}";
    }

    private static function gcd(int $a, int $b): int {
        while ($b != 0) {
            $t = $b;
            $b = $a % $b;
            $a = $t;
        }
        return abs($a);
    }

    /**
     * Obtiene el valor notable exacto de seno y coseno para ángulos notables
     */
    public static function getNotableValue(float $deg): array {
        $deg = self::normalizeAngle($deg);
        $ref = self::getReferenceAngle($deg);
        $quad = self::getQuadrant($deg);

        $sinRef = "";
        $cosRef = "";
        $sinNum = 0.0;
        $cosNum = 0.0;

        if ($ref == 0) {
            $sinRef = "0"; $cosRef = "1";
            $sinNum = 0; $cosNum = 1;
        } elseif ($ref == 30) {
            $sinRef = "1/2"; $cosRef = "\\sqrt{3}/2";
            $sinNum = 0.5; $cosNum = sqrt(3)/2;
        } elseif ($ref == 45) {
            $sinRef = "\\sqrt{2}/2"; $cosRef = "\\sqrt{2}/2";
            $sinNum = sqrt(2)/2; $cosNum = sqrt(2)/2;
        } elseif ($ref == 60) {
            $sinRef = "\\sqrt{3}/2"; $cosRef = "1/2";
            $sinNum = sqrt(3)/2; $cosNum = 0.5;
        } elseif ($ref == 90) {
            $sinRef = "1"; $cosRef = "0";
            $sinNum = 1; $cosNum = 0;
        }

        // Signos por cuadrante
        $sinSign = ($quad == 'III' || $quad == 'IV') ? -1 : 1;
        $cosSign = ($quad == 'II' || $quad == 'III') ? -1 : 1;

        if ($deg == 180) { $sinSign = 1; $cosSign = -1; }
        if ($deg == 270) { $sinSign = -1; $cosSign = 1; }

        return [
            'sin_exact' => ($sinSign < 0 && $sinRef != "0" ? "-" : "") . $sinRef,
            'cos_exact' => ($cosSign < 0 && $cosRef != "0" ? "-" : "") . $cosRef,
            'sin_numeric' => $sinNum * $sinSign,
            'cos_numeric' => $cosNum * $cosSign,
            'quadrant' => $quad,
            'reference_angle' => $ref
        ];
    }

    /**
     * Analiza una respuesta de usuario y detecta si contiene un error típico
     */
    public static function analyzeAnswer(string $userMsg, float $angle, string $functionTarget, string $expectedVal): array {
        $cleaned = trim(strtolower($userMsg));
        $notable = self::getNotableValue($angle);
        
        $detectedError = null;

        // 1. Detección de error de signo por cuadrante
        if ($functionTarget === 'sin') {
            $expectedSign = ($notable['quadrant'] === 'III' || $notable['quadrant'] === 'IV') ? '-' : '+';
            if ($expectedSign === '+' && str_contains($cleaned, '-') && (str_contains($cleaned, '1/2') || str_contains($cleaned, '0.5'))) {
                $detectedError = 'ERR_SIGN_QUADRANT';
            } elseif ($expectedSign === '-' && !str_contains($cleaned, '-') && (str_contains($cleaned, '1/2') || str_contains($cleaned, '0.5'))) {
                $detectedError = 'ERR_SIGN_QUADRANT';
            }
        } elseif ($functionTarget === 'cos') {
            $expectedSign = ($notable['quadrant'] === 'II' || $notable['quadrant'] === 'III') ? '-' : '+';
            if ($expectedSign === '+' && str_contains($cleaned, '-') && (str_contains($cleaned, '1/2') || str_contains($cleaned, '0.5'))) {
                $detectedError = 'ERR_SIGN_QUADRANT';
            } elseif ($expectedSign === '-' && !str_contains($cleaned, '-') && (str_contains($cleaned, '1/2') || str_contains($cleaned, '0.5'))) {
                $detectedError = 'ERR_SIGN_QUADRANT';
            }
        }

        // 2. Confusión Seno y Coseno
        if ($functionTarget === 'sin' && (str_contains($cleaned, 'sqrt(3)/2') || str_contains($cleaned, '√3/2')) && $notable['reference_angle'] == 30) {
            $detectedError = 'ERR_CONFUSE_SIN_COS';
        }

        return [
            'is_exact_match' => (str_contains($cleaned, strtolower(trim($expectedVal)))),
            'detected_error' => $detectedError,
            'notable_info' => $notable
        ];
    }
}
