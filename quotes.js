// Quotes and content data for WhatsApp bot
// Contains anime quotes, wisdom quotes, pantun, poems, and facts

const animeQuotes = [
    {
        text: "Jika kamu tidak suka takdirmu, jangan menerimanya. Sebaliknya, miliki keberanian untuk mengubahnya sesuai keinginanmu.",
        character: "Naruto Uzumaki",
        anime: "Naruto"
    },
    {
        text: "Orang yang tidak bisa membuang apapun, tidak akan bisa mengubah apapun.",
        character: "Armin Arlert",
        anime: "Attack on Titan"
    },
    {
        text: "Bukan tentang apakah kamu bisa atau tidak. Beberapa hal dalam hidup, kamu hanya harus melakukannya.",
        character: "Yusuke Urameshi",
        anime: "Yu Yu Hakusho"
    },
    {
        text: "Ketika kamu punya sesuatu yang penting untuk dilindungi, itulah saat kamu benar-benar menjadi kuat.",
        character: "Haku",
        anime: "Naruto"
    },
    {
        text: "Masa lalu adalah masa lalu. Yang terpenting adalah apa yang kamu pilih untuk menjadi dari sekarang.",
        character: "Piccolo",
        anime: "Dragon Ball Z"
    },
    {
        text: "Tidak apa-apa kalau kamu tidak berbakat. Kalau kamu bekerja keras, kamu bisa mengatasi bakat apapun.",
        character: "Rock Lee",
        anime: "Naruto"
    },
    {
        text: "Jangan pernah biarkan seseorang mengatakan bahwa kamu tidak bisa melakukan sesuatu. Bahkan aku.",
        character: "Monkey D. Luffy",
        anime: "One Piece"
    },
    {
        text: "Untuk melindungi sesuatu yang penting, kekuatan sendirian tidak cukup.",
        character: "Ichigo Kurosaki",
        anime: "Bleach"
    },
    {
        text: "Jika kamu tidak berani mengambil risiko, kamu tidak akan pernah bisa mengubah apapun.",
        character: "Eren Yeager",
        anime: "Attack on Titan"
    },
    {
        text: "Bahkan jika kamu gagal, kamu harus bangga karena sudah berusaha.",
        character: "Vegeta",
        anime: "Dragon Ball Z"
    },
    {
        text: "Kehidupan tidak harus sesuai dengan ekspektasi siapapun.",
        character: "Senku Ishigami",
        anime: "Dr. Stone"
    },
    {
        text: "Keajaiban hanya terjadi pada mereka yang tidak pernah menyerah.",
        character: "Natsu Dragneel",
        anime: "Fairy Tail"
    },
    {
        text: "Jangan menilai orang dari penampilannya. Karena penampilan bisa menipu.",
        character: "Kakashi Hatake",
        anime: "Naruto"
    },
    {
        text: "Yang terpenting bukan seberapa keras kamu memukul, tapi seberapa keras kamu bisa dipukul dan tetap maju.",
        character: "Ippo Makunouchi",
        anime: "Hajime no Ippo"
    },
    {
        text: "Kekuatan sejati datang dari melindungi hal yang kamu cintai.",
        character: "Ichigo Kurosaki",
        anime: "Bleach"
    }
];

const wisdomQuotes = [
    {
        text: "Kegagalan adalah kesuksesan yang tertunda.",
        author: "Napoleon Hill"
    },
    {
        text: "Pendidikan adalah senjata paling ampuh yang bisa kamu gunakan untuk mengubah dunia.",
        author: "Nelson Mandela"
    },
    {
        text: "Jangan menunggu. Waktu tidak akan pernah tepat.",
        author: "Napoleon Hill"
    },
    {
        text: "Kesuksesan adalah perjalanan, bukan tujuan.",
        author: "Ben Sweetland"
    },
    {
        text: "Yang terbaik dari masa depan dimulai dari sekarang.",
        author: "Anonim"
    },
    {
        text: "Hidup ini seperti sepeda. Untuk menjaga keseimbangan, kamu harus terus bergerak.",
        author: "Albert Einstein"
    },
    {
        text: "Jangan takut untuk memulai dari awal. Kali ini kamu tidak buta lagi.",
        author: "Rupi Kaur"
    },
    {
        text: "Kebahagiaan bukan tujuan, melainkan hasil.",
        author: "Eleanor Roosevelt"
    },
    {
        text: "Percaya pada dirimu sendiri dan semua yang kamu miliki.",
        author: "Christian D. Larson"
    },
    {
        text: "Kamu tidak akan pernah terlalu tua untuk menetapkan tujuan baru atau bermimpi lagi.",
        author: "C.S. Lewis"
    },
    {
        text: "Kesabaran adalah kunci dari semua pintu kebahagiaan.",
        author: "Ali bin Abi Thalib"
    },
    {
        text: "Ilmu pengetahuan tanpa agama adalah lumpuh, agama tanpa ilmu pengetahuan adalah buta.",
        author: "Albert Einstein"
    },
    {
        text: "Bersiaplah untuk masa depan, karena itulah tempat kamu akan menghabiskan sisa hidupmu.",
        author: "George Burns"
    },
    {
        text: "Jika kamu ingin hidup bahagia, kaitkan hidupmu dengan tujuan, bukan dengan orang atau benda.",
        author: "Albert Einstein"
    },
    {
        text: "Keberanian bukan tidak adanya rasa takut, melainkan kemampuan untuk mengatasinya.",
        author: "Nelson Mandela"
    }
];

const pantun = [
    {
        sampiran1: "Jalan-jalan ke kota Bogor",
        sampiran2: "Jangan lupa membeli duku",
        isi1: "Kalau hidup hanya bermalas",
        isi2: "Kapan majunya nasib kita"
    },
    {
        sampiran1: "Buah jambu di atas meja",
        sampiran2: "Dimakan sambil minum kopi",
        isi1: "Kalau kamu rajin belajar",
        isi2: "Pasti masa depan cerah nanti"
    },
    {
        sampiran1: "Pergi ke pasar membeli wortel",
        sampiran2: "Pulang bawa buah manggis",
        isi1: "Belajar yang rajin jangan malas",
        isi2: "Biar jadi orang sukses"
    },
    {
        sampiran1: "Burung merpati terbang tinggi",
        sampiran2: "Hinggap di pohon beringin",
        isi1: "Persahabatan jangan dilupa",
        isi2: "Sampai kapanpun tetap terkenang"
    },
    {
        sampiran1: "Bunga mawar mekar di taman",
        sampiran2: "Harum semerbak ke mana-mana",
        isi1: "Hidup ini penuh dengan ujian",
        isi2: "Hadapi dengan tegar dan sabar"
    },
    {
        sampiran1: "Ikan mas berenang di kolam",
        sampiran2: "Bersama ikan mas koki",
        isi1: "Rajin menabung sejak dini",
        isi2: "Masa depan jadi terjamin"
    },
    {
        sampiran1: "Pohon mangga berbuah lebat",
        sampiran2: "Burung-burung bertengger riang",
        isi1: "Ilmu yang bermanfaat",
        isi2: "Akan selalu berguna sepanjang masa"
    },
    {
        sampiran1: "Kucing belang tidur di kasur",
        sampiran2: "Bermimpi kejar tikus putih",
        isi1: "Kalau berbuat jangan sombong",
        isi2: "Rendah hati itu lebih baik"
    }
];

const poems = [
    {
        title: "Pagi",
        author: "Sapardi Djoko Damono",
        content: `Pagi ini kau datang lagi\nDengan sinar mentari\nMembangunkan dunia\nDari tidur malamnya\n\nBurung-burung bernyanyi\nAnak-anak tertawa\nSemua makhluk bersyukur\nAtasku karunia-Mu`
    },
    {
        title: "Hujan",
        author: "W.S. Rendra",
        content: `Hujan turun membasahi bumi\nMencuci debu dan dosa\nMemberi kehidupan baru\nPada setiap makhluk\n\nDengarkan lagu hujan\nDi atas genteng rumah\nSebuah simfoni alam\nYang tak pernah lelah`
    },
    {
        title: "Senja",
        author: "Chairil Anwar",
        content: `Senja datang membawa damai\nLangit berubah jingga\nMatahari pamit pulang\nSampai esok hari\n\nAngin bertiup sepoi\nDaun bergoyang pelan\nSemua terasa tenang\nDi penghujung hari`
    },
    {
        title: "Ibu",
        author: "Traditional",
        content: `Ibu adalah madrasah pertama\nTempat belajar kehidupan\nKasih sayang tak terbatas\nPengorbanan tanpa pamrih\n\nTerima kasih ibu\nAtas semua yang telah kau berikan\nJasamu tak terbayar\nCintamu tak terhingga`
    },
    {
        title: "Sahabat",
        author: "Taufiq Ismail",
        content: `Sahabat adalah harta\nYang tak ternilai harganya\nDi saat suka dan duka\nSelalu ada menemani\n\nTerima kasih sahabat\nAtas kesetiaan yang tulus\nPersahabatan kita\nAkan abadi selamanya`
    },
    {
        title: "Mimpi",
        author: "Goenawan Mohamad",
        content: `Mimpi adalah jendela\nKe dunia yang tak terbatas\nDi sana kita bebas\nMenjadi apapun yang kita mau\n\nJangan pernah berhenti bermimpi\nKarena mimpi adalah awal\nDari semua pencapaian\nYang akan kita raih`
    }
];

const uniqueFacts = [
    "Manusia rata-rata menghabiskan 6 bulan dalam hidupnya untuk menunggu lampu merah berubah menjadi hijau.",
    "Jantung udang terletak di kepala mereka.",
    "Kecoak bisa hidup selama beberapa minggu tanpa kepala sebelum akhirnya mati karena kelaparan.",
    "Dalam bahasa Inggris, kata 'set' memiliki arti paling banyak - lebih dari 430 definisi berbeda.",
    "Madu tidak akan pernah basi. Madu yang ditemukan di makam Mesir kuno masih bisa dimakan.",
    "Lumba-lumba memiliki nama untuk satu sama lain - mereka menggunakan suara klik unik sebagai 'nama'.",
    "Gurita memiliki tiga jantung dan darah berwarna biru.",
    "Satu hari di Venus lebih lama dari satu tahun di Venus.",
    "Manusia memiliki lebih sedikit sel di tubuh mereka daripada bakteri.",
    "Jika kamu melipat selembar kertas sebanyak 42 kali, ketebalannya akan mencapai bulan.",
    "Beruang kutub memiliki kulit hitam di bawah bulu putih mereka.",
    "Pisang secara teknis adalah buah berry, sedangkan strawberry bukan.",
    "Ikan mas hanya memiliki ingatan selama 3 detik adalah mitos - mereka sebenarnya bisa mengingat selama bulan.",
    "Mata manusia bisa membedakan sekitar 10 juta warna yang berbeda.",
    "Satu sendok teh materi neutron akan seberat sekitar 6 miliar ton.",
    "Kuku tangan tumbuh sekitar 4 kali lebih cepat daripada kuku kaki.",
    "Ada lebih banyak kemungkinan permainan catur daripada jumlah atom di alam semesta yang dapat diamati.",
    "Koala tidur hingga 22 jam per hari.",
    "Jika kamu meneriakkan sesuatu selama 8 tahun 7 bulan 6 hari, kamu akan menghasilkan energi yang cukup untuk memanaskan satu cangkir kopi.",
    "Manusia dan pisang berbagi sekitar 60% DNA yang sama."
];

module.exports = {
    animeQuotes,
    wisdomQuotes,
    pantun,
    poems,
    uniqueFacts
};
