// Game data for WhatsApp bot
// Contains questions, answers, and content for various interactive games

const guessWords = [
    {
        word: "komputer",
        hint: "Perangkat elektronik untuk mengolah data",
        category: "Teknologi",
        difficulty: "easy"
    },
    {
        word: "smartphone",
        hint: "Telepon pintar yang bisa internet",
        category: "Teknologi",
        difficulty: "easy"
    },
    {
        word: "algoritma",
        hint: "Urutan langkah untuk menyelesaikan masalah",
        category: "Teknologi",
        difficulty: "medium"
    },
    {
        word: "indonesia",
        hint: "Negara kepulauan di Asia Tenggara",
        category: "Geografi",
        difficulty: "easy"
    },
    {
        word: "photosynthesis",
        hint: "Proses tumbuhan membuat makanan dengan bantuan matahari",
        category: "Sains",
        difficulty: "hard"
    },
    {
        word: "sejarah",
        hint: "Ilmu yang mempelajari peristiwa masa lalu",
        category: "Pendidikan",
        difficulty: "easy"
    },
    {
        word: "gravitasi",
        hint: "Gaya tarik bumi terhadap benda",
        category: "Fisika",
        difficulty: "medium"
    },
    {
        word: "demokrasi",
        hint: "Sistem pemerintahan dari rakyat untuk rakyat",
        category: "Politik",
        difficulty: "medium"
    },
    {
        word: "ekosistem",
        hint: "Hubungan timbal balik makhluk hidup dengan lingkungan",
        category: "Biologi",
        difficulty: "hard"
    },
    {
        word: "javascript",
        hint: "Bahasa pemrograman untuk web",
        category: "Programming",
        difficulty: "medium"
    }
];

const family100 = [
    {
        question: "Sebutkan benda yang ada di kamar tidur",
        answers: ["kasur", "bantal", "lemari", "lampu", "cermin", "meja", "kursi"]
    },
    {
        question: "Sebutkan makanan khas Indonesia",
        answers: ["nasi gudeg", "rendang", "sate", "gado-gado", "bakso", "soto", "nasi padang"]
    },
    {
        question: "Sebutkan profesi yang menggunakan seragam",
        answers: ["polisi", "dokter", "perawat", "pilot", "pramugari", "tentara", "security"]
    },
    {
        question: "Sebutkan hewan yang bisa terbang",
        answers: ["burung", "kupu-kupu", "lebah", "kelelawar", "lalat", "nyamuk", "capung"]
    },
    {
        question: "Sebutkan mata pelajaran di sekolah",
        answers: ["matematika", "bahasa indonesia", "ipa", "ips", "bahasa inggris", "olahraga", "seni"]
    },
    {
        question: "Sebutkan alat transportasi",
        answers: ["mobil", "motor", "bus", "kereta", "pesawat", "kapal", "sepeda"]
    },
    {
        question: "Sebutkan buah yang berwarna merah",
        answers: ["apel", "strawberry", "ceri", "tomat", "semangka", "delima", "jambu"]
    },
    {
        question: "Sebutkan pekerjaan di rumah sakit",
        answers: ["dokter", "perawat", "bidan", "apoteker", "radiologi", "laboratorium", "admin"]
    }
];

const brainTeasers = [
    {
        question: "Apa yang selalu basah tapi tidak pernah kering?",
        answer: "lidah",
        hint: "Bagian tubuh yang ada di mulut",
        difficulty: "medium"
    },
    {
        question: "Binatang apa yang namanya 2 huruf?",
        answer: "unta",
        hint: "Hewan gurun yang punya punuk",
        difficulty: "easy"
    },
    {
        question: "Apa yang bisa berlari tapi tidak punya kaki?",
        answer: "air",
        hint: "Cairan yang kita minum setiap hari",
        difficulty: "medium"
    },
    {
        question: "Buah apa yang tidak bisa dibuat jus?",
        answer: "buah hati",
        hint: "Bukan buah yang bisa dimakan",
        difficulty: "hard"
    },
    {
        question: "Apa yang hitam kalau dibeli, merah kalau dipakai, abu-abu kalau dibuang?",
        answer: "arang",
        hint: "Bahan bakar untuk memasak",
        difficulty: "hard"
    },
    {
        question: "Pintu apa yang tidak bisa dibuka?",
        answer: "pintu hati",
        hint: "Bukan pintu yang sesungguhnya",
        difficulty: "medium"
    },
    {
        question: "Apa yang semakin diambil semakin besar?",
        answer: "lubang",
        hint: "Semakin digali semakin dalam",
        difficulty: "medium"
    },
    {
        question: "Telor apa yang sangar?",
        answer: "telortoar",
        hint: "Permainan kata dengan 'sangar'",
        difficulty: "easy"
    }
];

const cakLontong = [
    {
        question: "Kentang apa yang bisa jalan?",
        answer: "kentang goreng",
        hint: "Makanan yang biasa dimakan dengan burger",
        difficulty: "easy"
    },
    {
        question: "Bebek apa yang jalannya muter?",
        answer: "bebek betul",
        hint: "Permainan kata dengan 'betul'",
        difficulty: "medium"
    },
    {
        question: "Ikan apa yang tidak bisa berenang?",
        answer: "ikan bilis",
        hint: "Permainan kata dengan nama ikan kecil",
        difficulty: "medium"
    },
    {
        question: "Nasi apa yang pedas?",
        answer: "nasi kapok",
        hint: "Permainan kata dengan 'pedes'",
        difficulty: "easy"
    },
    {
        question: "Buah apa yang paling sedih?",
        answer: "buah apel",
        hint: "Permainan kata dengan perasaan",
        difficulty: "hard"
    },
    {
        question: "Monyet apa yang rambutnya keriting?",
        answer: "monyet gondrong",
        hint: "Jenis rambut yang tidak lurus",
        difficulty: "medium"
    },
    {
        question: "Ayam apa yang besar?",
        answer: "ayam jago",
        hint: "Ayam jantan dewasa",
        difficulty: "easy"
    },
    {
        question: "Sate apa yang tidak bisa dimakan?",
        answer: "sate lit",
        hint: "Permainan kata dengan kata kerja",
        difficulty: "medium"
    }
];

const flags = [
    {
        country: "Indonesia",
        hint: "Merah putih, negara kepulauan terbesar",
        difficulty: "easy"
    },
    {
        country: "Malaysia",
        hint: "14 garis merah putih dengan bulan sabit biru",
        difficulty: "easy"
    },
    {
        country: "Singapura",
        hint: "Merah putih dengan bulan sabit dan 5 bintang",
        difficulty: "medium"
    },
    {
        country: "Thailand",
        hint: "Garis horizontal merah, putih, biru, putih, merah",
        difficulty: "medium"
    },
    {
        country: "Jepang",
        hint: "Lingkaran merah di tengah latar putih",
        difficulty: "easy"
    },
    {
        country: "Amerika Serikat",
        hint: "Bintang dan garis merah putih biru",
        difficulty: "easy"
    },
    {
        country: "Brasil",
        hint: "Hijau dengan berlian kuning dan lingkaran biru",
        difficulty: "medium"
    },
    {
        country: "Prancis",
        hint: "Tiga garis vertikal biru, putih, merah",
        difficulty: "medium"
    }
];

const songs = [
    {
        title: "Indonesia Raya",
        artist: "WR Supratman",
        hint: "Lagu kebangsaan Indonesia",
        difficulty: "easy"
    },
    {
        title: "Bengawan Solo",
        artist: "Gesang",
        hint: "Lagu tentang sungai di Jawa Tengah",
        difficulty: "medium"
    },
    {
        title: "Tanah Airku",
        artist: "Ibu Sud",
        hint: "Lagu nasional tentang cinta tanah air",
        difficulty: "medium"
    },
    {
        title: "Halo Halo Bandung",
        artist: "Ismail Marzuki",
        hint: "Lagu tentang kota kembang",
        difficulty: "medium"
    },
    {
        title: "Rayuan Pulau Kelapa",
        artist: "Ismail Marzuki",
        hint: "Lagu tentang keindahan Indonesia",
        difficulty: "hard"
    },
    {
        title: "Gugur Bunga",
        artist: "Ismail Marzuki",
        hint: "Lagu tentang perjuangan kemerdekaan",
        difficulty: "hard"
    },
    {
        title: "Burung Kakatua",
        artist: "Traditional",
        hint: "Lagu anak-anak tentang burung",
        difficulty: "easy"
    },
    {
        title: "Soleram",
        artist: "Traditional",
        hint: "Lagu daerah dari Riau",
        difficulty: "medium"
    }
];

const characters = [
    {
        name: "Naruto",
        anime: "Naruto",
        hint: "Ninja blonde yang ingin jadi Hokage",
        difficulty: "easy"
    },
    {
        name: "Luffy",
        anime: "One Piece",
        hint: "Kapten bajak laut topi jerami yang bisa melar",
        difficulty: "easy"
    },
    {
        name: "Goku",
        anime: "Dragon Ball",
        hint: "Saiyan yang suka makan dan bertarung",
        difficulty: "easy"
    },
    {
        name: "Eren Yeager",
        anime: "Attack on Titan",
        hint: "Manusia yang bisa berubah jadi titan",
        difficulty: "medium"
    },
    {
        name: "Tanjiro",
        anime: "Demon Slayer",
        hint: "Pemburu iblis dengan napas air",
        difficulty: "medium"
    },
    {
        name: "Light Yagami",
        anime: "Death Note",
        hint: "Pemegang Death Note yang ingin jadi dewa",
        difficulty: "medium"
    },
    {
        name: "Edward Elric",
        anime: "Fullmetal Alchemist",
        hint: "Alkemis muda yang mencari philosopher stone",
        difficulty: "hard"
    },
    {
        name: "Senku Ishigami",
        anime: "Dr. Stone",
        hint: "Genius sains di dunia yang membatu",
        difficulty: "hard"
    }
];

const truthQuestions = [
    "Apa hal paling memalukan yang pernah kamu lakukan?",
    "Siapa crush pertama kamu?",
    "Apa ketakutan terbesar kamu?",
    "Kalau bisa jadi invisible selama 1 hari, apa yang akan kamu lakukan?",
    "Apa kebohongan terbesar yang pernah kamu katakan ke orang tua?",
    "Siapa orang yang paling kamu kagumi?",
    "Apa hal yang paling kamu sesali dalam hidup?",
    "Kalau harus memilih, kamu lebih suka kaya atau terkenal?",
    "Apa mimpi terburuk yang pernah kamu alami?",
    "Siapa di group ini yang menurutmu paling lucu?",
    "Apa hal paling aneh yang pernah kamu makan?",
    "Kalau bisa punya superpowers, apa yang kamu pilih?",
    "Apa lagu yang selalu kamu putar saat sedih?",
    "Siapa selebriti yang menurutmu paling overrated?",
    "Apa hobi yang kamu sembunyikan dari orang lain?"
];

const dareChallenges = [
    "Kirim voice note nyanyi lagu anak-anak",
    "Foto selfie dengan ekspresi paling aneh",
    "Ceritakan joke terburuk yang kamu tahu",
    "Kirim voice note meniru suara hewan",
    "Foto makanan terakhir yang kamu makan",
    "Tulis status WA dengan bahasa daerah",
    "Kirim screenshot playlist musik kamu",
    "Foto pemandangan dari jendela rumah kamu",
    "Tulis puisi 4 baris tentang pizza",
    "Kirim voice note bilang 'I love you' dalam 5 bahasa",
    "Foto koleksi sepatu yang kamu punya",
    "Ceritakan pengalaman paling awkward dalam 30 detik",
    "Kirim foto kuku kamu saat ini",
    "Tulis review 1 bintang untuk makanan favorit kamu",
    "Kirim voice note meniru gaya bicara presenter berita"
];

const riddles = [
    {
        question: "Aku punya mata tapi tidak bisa melihat, aku punya jarum tapi tidak bisa menjahit. Apa aku?",
        answer: "jam",
        hint: "Alat penunjuk waktu",
        difficulty: "medium"
    },
    {
        question: "Aku selalu mengikuti kamu tapi tidak pernah bisa kamu sentuh. Apa aku?",
        answer: "bayangan",
        hint: "Muncul saat ada cahaya",
        difficulty: "easy"
    },
    {
        question: "Aku punya rambut tapi tidak punya kepala. Apa aku?",
        answer: "jagung",
        hint: "Tanaman yang biasa dipopcorn",
        difficulty: "medium"
    },
    {
        question: "Semakin aku tua, semakin aku pendek. Apa aku?",
        answer: "lilin",
        hint: "Benda yang meleleh saat menyala",
        difficulty: "medium"
    },
    {
        question: "Aku bisa terbang tanpa sayap, menangis tanpa mata. Apa aku?",
        answer: "awan",
        hint: "Ada di langit dan bisa hujan",
        difficulty: "hard"
    },
    {
        question: "Aku punya gigi tapi tidak bisa mengunyah. Apa aku?",
        answer: "sisir",
        hint: "Alat untuk merapikan rambut",
        difficulty: "easy"
    },
    {
        question: "Aku hidup tanpa bernapas, aku dingin dalam mati. Apa aku?",
        answer: "ikan",
        hint: "Hewan air yang berinsang",
        difficulty: "hard"
    },
    {
        question: "Aku punya leher tapi tidak punya kepala. Apa aku?",
        answer: "botol",
        hint: "Wadah untuk minum",
        difficulty: "medium"
    }
];

const wordScrambles = [
    {
        scrambled: "NASIINODE",
        answer: "INDONESIA",
        hint: "Negara kepulauan",
        difficulty: "medium"
    },
    {
        scrambled: "PKOUMRET",
        answer: "KOMPUTER",
        hint: "Alat elektronik",
        difficulty: "easy"
    },
    {
        scrambled: "TEKNOLOGI",
        answer: "TEKNOLOGI",
        hint: "Sudah benar",
        difficulty: "easy"
    },
    {
        scrambled: "JKAARTA",
        answer: "JAKARTA",
        hint: "Ibu kota Indonesia",
        difficulty: "easy"
    },
    {
        scrambled: "ITNERNETT",
        answer: "INTERNET",
        hint: "Jaringan global",
        difficulty: "medium"
    },
    {
        scrambled: "PEMOGRAMAN",
        answer: "PROGRAMMING",
        hint: "Membuat kode",
        difficulty: "hard"
    },
    {
        scrambled: "HANPONT",
        answer: "PONSEL",
        hint: "Telepon genggam",
        difficulty: "medium"
    },
    {
        scrambled: "KAMELIDDN",
        answer: "KEMERDEKAAN",
        hint: "17 Agustus 1945",
        difficulty: "hard"
    }
];

const whoAmI = [
    {
        clues: [
            "Aku adalah presiden pertama Indonesia",
            "Aku yang memproklamirkan kemerdekaan",
            "Namaku ada di mata uang Rp 100.000",
            "Aku dijuluki Bapak Bangsa"
        ],
        answer: "soekarno",
        difficulty: "easy"
    },
    {
        clues: [
            "Aku adalah ilmuwan terkenal",
            "Aku menemukan teori relativitas",
            "Rambutku keriting dan putih",
            "E=mc² adalah rumusku"
        ],
        answer: "einstein",
        difficulty: "medium"
    },
    {
        clues: [
            "Aku adalah pendiri Microsoft",
            "Aku pernah jadi orang terkaya dunia",
            "Aku sangat peduli dengan kesehatan global",
            "Windows adalah ciptaanku"
        ],
        answer: "bill gates",
        difficulty: "medium"
    },
    {
        clues: [
            "Aku adalah superhero dari DC Comics",
            "Aku bisa terbang dan punya kekuatan super",
            "Aku berasal dari planet Krypton",
            "Aku takut dengan Kryptonite"
        ],
        answer: "superman",
        difficulty: "easy"
    },
    {
        clues: [
            "Aku adalah penulis novel Harry Potter",
            "Aku orang Inggris",
            "Bukuku diterjemahkan ke banyak bahasa",
            "Aku menciptakan dunia sihir Hogwarts"
        ],
        answer: "jk rowling",
        difficulty: "hard"
    },
    {
        clues: [
            "Aku adalah pemain sepak bola Argentina",
            "Aku dijuluki La Pulga (Si Kutu)",
            "Aku bermain untuk Paris Saint-Germain",
            "Aku memenangkan 7 Ballon d'Or"
        ],
        answer: "messi",
        difficulty: "medium"
    }
];

module.exports = {
    guessWords,
    family100,
    brainTeasers,
    cakLontong,
    flags,
    songs,
    characters,
    truthQuestions,
    dareChallenges,
    riddles,
    wordScrambles,
    whoAmI
};
