<?php
session_start();
$method = $_SERVER['REQUEST_METHOD'];
$body = file_get_contents("php://input");

// Felder von Request Validieren
function validate($request) {
    $error = null;
if (!isset($request['kalorienZiel']) || $request['kalorienZiel'] === "") {
    $error = ['error' => "Das Kalorienziel muss mit einer gültigen Zahl ausgefüllt sein."];
} else if (!is_numeric($request['kalorienZiel']) || $request['kalorienZiel'] <= 0 || $request['kalorienZiel'] > 10000) {
    $error = ['error' => "Das Kalorienziel muss grösser als 0 und maximal 10'000 kcal sein."];
} else if (!isset($request['lebensmittelName']) || empty(trim($request['lebensmittelName']))) {
    $error = ['error' => "Bitte einen Lebensmittelnamen eingeben."];
} else if (!preg_match('/^[a-zA-Z\s]+$/', $request['lebensmittelName'])) {
    $error = ['error' => "Nur Buchstaben und Leerzeichen erlaubt."];
} else if (!isset($request['lebensmittelMenge']) || $request['lebensmittelMenge'] === "") {
    $error = ['error' => "Die Menge muss mit einer gültigen Zahl ausgefüllt sein."];
} else if (!is_numeric($request['lebensmittelMenge']) || $request['lebensmittelMenge'] <= 0) {
    $error = ['error' => "Die Menge muss eine Zahl grösser als 0 sein."];
} else if (!isset($request['einheit']) || empty($request['einheit'])) {
    $error = ['error' => "Bitte eine Einheit auswählen."];
}
    if ($error) {
        echo json_encode($error);
        http_response_code(400);
        exit;
    }
}

// Funktion zur Berechnung der Gesamtkalorien
function berechneKalorienZusammenfassung($lebensmittel) {
    $kalorien = 0;
    $fett = 0;
    $eiweiss = 0;
    $kohlenhydrate = 0;

    foreach ($lebensmittel as $item) {
        $kalorien += $item['kalorien'];
        $fett += $item['fett'];
        $eiweiss += $item['eiweiss'];
        $kohlenhydrate += $item['kohlenhydrate'];
    }

    return [
        'kalorien' => $kalorien,
        'fett' => $fett,
        'eiweiss' => $eiweiss,
        'kohlenhydrate' => $kohlenhydrate
    ];
}

// Zusatztechnik 3: Lebensmitteldaten werden von der Edamam API mittels App-ID und App-Key geholt.
// Gefundene Daten werden im Frontend ausgegeben und eine Gesamtübericht wird im Backend berechnet und ebenfalls ausgegeben.
if ($method === "POST") {
    $request = json_decode($body, true);
    validate($request);
    $appID = "059976d6";
    $appKey = "a6949cfc005a0410bd3f1eda29d7173a";

    $apiUrl = "https://api.edamam.com/api/nutrition-data?app_id=$appID&app_key=$appKey&ingr=" .
              urlencode("{$request['lebensmittelMenge']} {$request['einheit']} {$request['lebensmittelName']}");
    $apiResponse = json_decode(file_get_contents($apiUrl), true);

    if (!$apiResponse) {
        echo json_encode(['error' => 'Fehler beim Abrufen der API-Daten']);
        http_response_code(500);
        exit;
    }
    if (
        !isset($apiResponse['totalNutrients']) ||
        empty($apiResponse['totalNutrients']['ENERC_KCAL']['quantity']) &&
        empty($apiResponse['totalNutrients']['FAT']['quantity']) &&
        empty($apiResponse['totalNutrients']['PROCNT']['quantity']) &&
        empty($apiResponse['totalNutrients']['CHOCDF']['quantity'])
    ) {
        echo json_encode(['error' => 'Lebensmittel nicht gefunden. Bitte beachte, dass die Eingabe in Englisch erfolgen muss.']);
        http_response_code(400);
        exit;
    }
    $lebensmittelItem = [
        'name' => $request['lebensmittelName'],
        'kalorien' => $apiResponse['totalNutrients']['ENERC_KCAL']['quantity'] ?? 0,
        'fett' => $apiResponse['totalNutrients']['FAT']['quantity'] ?? 0,
        'eiweiss' => $apiResponse['totalNutrients']['PROCNT']['quantity'] ?? 0,
        'kohlenhydrate' => $apiResponse['totalNutrients']['CHOCDF']['quantity'] ?? 0,
    ];

    // Lebensmittel in der Session speichern um Daten während Session weiter zu verwenden
    // Dies ist nicht das Cookie, welches in der Aufgabenstellung verlangt wird...siehe dazu LebensmittelZiel-Cookie
    if (!isset($_SESSION['lebensmittel'])) {
        $_SESSION['lebensmittel'] = [];
    }
    $_SESSION['lebensmittel'][] = $lebensmittelItem;

    $zusammenfassung = berechneKalorienZusammenfassung($_SESSION['lebensmittel']);

    // Kalorienziel als Cookie setzen
    setcookie("kalorienZiel", $request['kalorienZiel'], time() + 3600, "/");

    echo json_encode([
        'message' => 'Kalorienziel erfolgreich gesetzt.',
        'zusammenfassung' => $zusammenfassung,
        'lebensmittelListe' => $_SESSION['lebensmittel'],
        'cookieKalorienZiel' => $_COOKIE['kalorienZiel'] ?? null
    ]);
    exit;
}

// GET-Anfrage: Cookie auslesen und zurückgeben
if ($method === "GET" && isset($_GET['reset']) && $_GET['reset'] === 'true') {
    // Lebensmittelliste zurücksetzen
    $_SESSION['lebensmittel'] = [];
    echo json_encode([
        'message' => 'Lebensmittelliste wurde zurückgesetzt.',
        'lebensmittelListe' => [],
        'zusammenfassung' => [
            'kalorien' => 0,
            'fett' => 0,
            'eiweiss' => 0,
            'kohlenhydrate' => 0
        ]
    ]);
    exit;
}
if ($method === "GET") {
    echo json_encode([
        'message' => 'Cookie-Abruf erfolgreich.',
        'cookieKalorienZiel' => $_COOKIE['kalorienZiel'] ?? 'Kein Cookie gesetzt'
    ]);
    exit;
}
?>