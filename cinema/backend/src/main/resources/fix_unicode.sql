-- =====================================================
-- FIX UNICODE - VERSION 3 (Final, correct constraint handling)
-- =====================================================
USE cinema;
GO
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- BUOC 1: DROP UNIQUE CONSTRAINTS & CHECK CONSTRAINTS
-- can thiet de ALTER COLUMN
-- =====================================================

-- users: drop unique(username) va check(role), check(status)
ALTER TABLE users DROP CONSTRAINT UKr43af9ap4edm43mmtq01oddj6;   -- UNIQUE username
ALTER TABLE users DROP CONSTRAINT CK__users__role__412EB0B6;      -- CHECK role
ALTER TABLE users DROP CONSTRAINT CK__users__status__4222D4EF;    -- CHECK status
GO

-- vouchers: drop unique(code) va check(type)
ALTER TABLE vouchers DROP CONSTRAINT UK30ftp2biebbvpik8e49wlmady; -- UNIQUE code
ALTER TABLE vouchers DROP CONSTRAINT CK__vouchers__type__44FF419A;-- CHECK type
GO

-- bookings: drop check(status)
ALTER TABLE bookings DROP CONSTRAINT CK__bookings__status__36B12243; -- CHECK status
GO

-- reviews: drop unique(movie_id, user_id)
ALTER TABLE reviews DROP CONSTRAINT UKovijrmb7g6cvqvlgr25vb8r98;  -- UNIQUE(movie_id,user_id)
GO

-- =====================================================
-- BUOC 2: DROP FOREIGN KEYS (de TRUNCATE dc)
-- =====================================================
ALTER TABLE bookings         DROP CONSTRAINT FKc7q4u7vleq90vlvy8c7lmwtyl; -- bookings->showtimes
ALTER TABLE bookings         DROP CONSTRAINT FKeyog2oic85xg7hsu2je2lx3s6; -- bookings->users
ALTER TABLE contact_messages DROP CONSTRAINT FKj305kltauaydco2n00yr55nbk; -- contact->users
ALTER TABLE reviews          DROP CONSTRAINT FK87tlqya0rq8ijfjscldpvvdyq;  -- reviews->movies
ALTER TABLE reviews          DROP CONSTRAINT FKcgy7qjc1r99dp117y9en6lxye;  -- reviews->users
ALTER TABLE showtimes        DROP CONSTRAINT FKeltpyuei1d5g3n6ikpsjwwil6;  -- showtimes->movies
GO

PRINT 'BUOC 1+2: Da drop tat ca constraint & FK';
GO

-- =====================================================
-- BUOC 3: ALTER COLUMNS VARCHAR -> NVARCHAR
-- =====================================================
ALTER TABLE users ALTER COLUMN username   NVARCHAR(50)  NOT NULL;
ALTER TABLE users ALTER COLUMN full_name  NVARCHAR(100);
ALTER TABLE users ALTER COLUMN email      NVARCHAR(100);
ALTER TABLE users ALTER COLUMN phone      NVARCHAR(20);
ALTER TABLE users ALTER COLUMN role       NVARCHAR(50)  NOT NULL;
ALTER TABLE users ALTER COLUMN status     NVARCHAR(50)  NOT NULL;
GO

ALTER TABLE movies ALTER COLUMN title       NVARCHAR(200) NOT NULL;
ALTER TABLE movies ALTER COLUMN genres      NVARCHAR(MAX);
ALTER TABLE movies ALTER COLUMN description NVARCHAR(MAX);
ALTER TABLE movies ALTER COLUMN poster      NVARCHAR(MAX);
ALTER TABLE movies ALTER COLUMN director    NVARCHAR(200);
ALTER TABLE movies ALTER COLUMN cast        NVARCHAR(MAX);
ALTER TABLE movies ALTER COLUMN language    NVARCHAR(50);
ALTER TABLE movies ALTER COLUMN age_rating  NVARCHAR(10);
ALTER TABLE movies ALTER COLUMN trailer_url NVARCHAR(500);
GO

ALTER TABLE showtimes ALTER COLUMN room             NVARCHAR(50)  NOT NULL;
ALTER TABLE showtimes ALTER COLUMN booked_seat_nums NVARCHAR(MAX);
GO

ALTER TABLE bookings ALTER COLUMN seat_nums    NVARCHAR(MAX);
ALTER TABLE bookings ALTER COLUMN voucher_code NVARCHAR(50);
ALTER TABLE bookings ALTER COLUMN status       NVARCHAR(50)  NOT NULL;
GO

ALTER TABLE reviews ALTER COLUMN comment NVARCHAR(MAX);
GO

ALTER TABLE vouchers ALTER COLUMN code        NVARCHAR(50)  NOT NULL;
ALTER TABLE vouchers ALTER COLUMN title       NVARCHAR(200) NOT NULL;
ALTER TABLE vouchers ALTER COLUMN description NVARCHAR(MAX);
ALTER TABLE vouchers ALTER COLUMN type        NVARCHAR(50)  NOT NULL;
GO

ALTER TABLE contact_messages ALTER COLUMN name        NVARCHAR(100) NOT NULL;
ALTER TABLE contact_messages ALTER COLUMN email       NVARCHAR(100) NOT NULL;
ALTER TABLE contact_messages ALTER COLUMN phone       NVARCHAR(20);
ALTER TABLE contact_messages ALTER COLUMN subject     NVARCHAR(50)  NOT NULL;
ALTER TABLE contact_messages ALTER COLUMN message     NVARCHAR(MAX) NOT NULL;
ALTER TABLE contact_messages ALTER COLUMN status      NVARCHAR(20)  NOT NULL;
ALTER TABLE contact_messages ALTER COLUMN admin_reply NVARCHAR(MAX);
GO

PRINT 'BUOC 3: ALTER cot NVARCHAR HOAN THANH';
GO

-- =====================================================
-- BUOC 4: TRUNCATE DATA CU (gio da khong co FK)
-- =====================================================
TRUNCATE TABLE contact_messages;
TRUNCATE TABLE reviews;
TRUNCATE TABLE bookings;
TRUNCATE TABLE showtimes;
TRUNCATE TABLE vouchers;
TRUNCATE TABLE users;
TRUNCATE TABLE movies;
GO

PRINT 'BUOC 4: Xoa data cu HOAN THANH';
GO

-- =====================================================
-- BUOC 5: INSERT DATA DUNG VOI N PREFIX
-- =====================================================

-- USERS
-- Password: "123456" ma hoa BCrypt
SET IDENTITY_INSERT users ON;
INSERT INTO users (id,username,password,full_name,email,phone,role,status,created_at) VALUES
(1,N'admin',    N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i',N'Administrator',   N'vuthanhphong865@gmail.com',N'0971888888',N'ADMIN',N'ACTIVE',GETDATE()),
(2,N'nguyenvana',N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i',N'Nguyễn Văn A',  N'nguyenvana@gmail.com',     N'11111111110',N'USER', N'ACTIVE',GETDATE()),
(3,N'tranthib', N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i',N'Trần Thị B',     NULL,                        NULL,          N'USER', N'ACTIVE',GETDATE()),
(4,N'user123',  N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i',N'Hiếu',           NULL,                        NULL,          N'USER', N'ACTIVE',GETDATE()),
(5,N'eHvcllll', N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i',N'em H',           N'eHvcl@gmail.com',          N'0945353792', N'USER', N'ACTIVE',GETDATE()),
(6,N'phongvu',  N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i',N'Vũ Thành Phong', N'vuthanhphong@gmail.com',   N'1111111111', N'USER', N'ACTIVE',GETDATE()),
(7,N'user1234', N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh.i',N'Hoàng Minh Hiếu',N'minhhieuh707@gmail.com',   N'0983816508', N'USER', N'ACTIVE',GETDATE());
SET IDENTITY_INSERT users OFF;
GO

-- MOVIES
SET IDENTITY_INSERT movies ON;
INSERT INTO movies (id,title,genres,description,rating,duration,poster,director,cast,language,release_date,age_rating,trailer_url) VALUES
(1,N'Avengers: Endgame',        N'["Hành động"]',          N'Sau sự kiện Thanos tiêu diệt một nửa sinh vật trong vũ trụ bằng Găng tay Vô cực, các Avengers còn lại phải tập hợp lại lần cuối cùng để đảo ngược hành động của hắn và khôi phục trật tự vũ trụ.',8.4,181,N'https://4kwallpapers.com/images/walls/thumbs_3t/942.jpg',                                                                                                                                                        N'Anthony Russo, Joe Russo', N'Robert Downey Jr., Chris Evans, Scarlett Johansson', N'Tiếng Anh', N'2019-04-26',N'T13',N'https://www.youtube.com/watch?v=hA6hldpSTF8'),
(2,N'Spider-Man: No Way Home',  N'["Hành động"]',          N'Peter Parker nhờ Tiến sĩ Strange thực hiện một phép thuật để thế giới quên đi danh tính Spider-Man của mình, nhưng điều này đã vô tình mở ra đa vũ trụ.',                                          8.2,148,N'https://images8.alphacoders.com/121/thumb-1920-1218962.jpg',                                                                                                                                         N'Jon Watts',                N'Tom Holland, Zendaya, Benedict Cumberbatch',          N'Tiếng Anh', N'2021-12-17',N'T13',N'https://www.youtube.com/watch?v=JfVOs4VSpmA'),
(3,N'Parasite',                 N'["Giật gân"]',           N'Cả gia đình Ki-taek sống trong tình cảnh nghèo khó. Cơ hội thoát nghèo đến khi con trai cả được nhận làm gia sư cho gia đình tỷ phú Park.',                                                       8.5,132,N'https://images.wallpapersden.com/image/download/parasite-movie-poster_a25la2eUmZqaraWkpJRmbmdlrWZlbWU.jpg',                                                                                          N'Bong Joon Ho',             N'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong',          N'Tiếng Hàn', N'2019-05-30',N'T18',N'https://www.youtube.com/watch?v=SEUXfv87Wpk'),
(4,N'Interstellar',             N'["Khoa học viễn tưởng"]',N'Trong tương lai, Trái Đất đang dần cạn kiệt tài nguyên. Một nhóm phi hành gia thực hiện chuyến hành trình qua lỗ sâu đục để tìm kiếm hành tinh mới cho nhân loại.',                                8.6,169,N'https://images7.alphacoders.com/550/thumb-1920-550739.jpg',                                                                                                                                          N'Christopher Nolan',        N'Matthew McConaughey, Anne Hathaway, Jessica Chastain',N'Tiếng Anh', N'2014-11-07',N'T13',N'https://www.youtube.com/watch?v=2LqzF5WauAw'),
(5,N'The Dark Knight',          N'["Hành động"]',          N'Batman đối đầu với tên tội phạm điên loạn Joker, kẻ đang gieo rắc kinh hoàng và hỗn loạn cho người dân Gotham City.',                                                                              9.0,152,N'https://images8.alphacoders.com/457/thumb-1920-457955.jpg',                                                                                                                                          N'Christopher Nolan',        N'Christian Bale, Heath Ledger, Aaron Eckhart',         N'Tiếng Anh', N'2008-07-18',N'T16',N'https://www.youtube.com/watch?v=vbjYVETxZqM'),
(6,N'Your Name (Kimi no Na wa)',N'["Hoạt hình"]',          N'Một cô gái ở vùng núi và một chàng trai ở thành phố kỳ lạ chuyển đổi thân xác cho nhau. Khi sự đổi chỗ ngày càng thường xuyên hơn, họ bắt đầu liên hệ với nhau.',                                  8.4,106,N'https://kenh14cdn.com/2017/1-1485277071571.jpg',                                                                                                                                                    N'Makoto Shinkai',           N'Ryunosuke Kamiki, Mone Kamishiraishi',                N'Tiếng Nhật',N'2016-08-26',N'T13',N'https://www.youtube.com/watch?v=NooIc3dMncc'),
(7,N'Inside Out 2',             N'["Hoạt hình"]',          N'Riley bước vào tuổi teen và những cảm xúc mới xuất hiện trong đầu cô bé – đặc biệt là Anxiety (Lo lắng) – làm đảo lộn tất cả.',                                                                    7.8,100,N'https://upload.wikimedia.org/wikipedia/en/f/f7/Inside_Out_2_poster.jpg',                                                                                                                           N'Kelsey Mann',              N'Amy Poehler, Maya Hawke, Kensington Tallman',         N'Tiếng Anh', N'2024-06-14',N'P',  N'https://www.youtube.com/watch?v=LEjhY15eCx0'),
(8,N'Oppenheimer',              N'["Lịch sử"]',            N'Câu chuyện về J. Robert Oppenheimer, cha đẻ của bom nguyên tử, người đã dẫn dắt Dự án Manhattan trong Thế chiến II.',                                                                               8.3,180,N'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_SX300.jpg',                                                             N'Christopher Nolan',        N'Cillian Murphy, Emily Blunt, Matt Damon',             N'Tiếng Anh', N'2023-07-21',N'T16',N'https://www.youtube.com/watch?v=uYPbbksJxIg');
SET IDENTITY_INSERT movies OFF;
GO

-- VOUCHERS
SET IDENTITY_INSERT vouchers ON;
INSERT INTO vouchers (id,code,title,description,type,value,min_order_value,min_seats,max_discount,usage_limit,used_count,valid_from,valid_to,is_active,new_users_only,one_time_per_user,days_after_registration,weekend_only,created_at) VALUES
(1,N'WELCOME20',N'Chào mừng thành viên mới',N'Giảm 20% cho thành viên mới (sau 3 ngày đăng ký)',N'PERCENTAGE',20,   0,0,50000, 100,17,N'2026-01-01',N'2026-12-31',1,1,1,3,   0,N'2026-01-01'),
(2,N'COMBO3',   N'Mua 3 ghế giảm 15%',      N'Giảm 15% khi mua từ 3 ghế trở lên',               N'PERCENTAGE',15,   0,3,100000,50, 10,N'2026-01-01',N'2026-12-31',1,0,1,NULL,0,N'2026-01-01'),
(3,N'COMBO5',   N'Mua 5 ghế giảm 25%',      N'Giảm 25% khi mua từ 5 ghế trở lên',               N'PERCENTAGE',25,   0,5,150000,30, 4, N'2026-01-01',N'2026-12-31',1,0,1,NULL,0,N'2026-01-01'),
(4,N'WEEKEND50',N'Cuối tuần giảm 50k',      N'Giảm 50.000đ cho vé cuối tuần (T7-CN)',            N'FIXED',     50000, 0,0,50000, 200,45,N'2026-01-01',N'2026-12-31',1,0,1,NULL,1,N'2026-01-01');
SET IDENTITY_INSERT vouchers OFF;
GO

-- SHOWTIMES
SET IDENTITY_INSERT showtimes ON;
INSERT INTO showtimes (id,movie_id,date,time,room,total_seats,price,booked_seat_nums) VALUES
(1, 1,N'2026-06-08',N'10:00',N'Phòng 1',100,80000, N'["C10","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","G1","G2","G3","G4","G5","G6","G7","G8","G9","G10","H1","A7","A8"]'),
(2, 1,N'2026-06-08',N'14:00',N'Phòng 2',80, 80000, N'["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","E1","E2","E3","E4","E5","E6","E7","E8","E9","E10"]'),
(3, 1,N'2026-06-08',N'19:30',N'Phòng 1',100,100000,N'["B9","B10","C1","C2","C3","C4","C5","C6","C7","C8","C9","C10","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","G1","G2","G3","G4","G5","G6","G7","G8","G9","G10","H1","H2","H3","H4","H5","H6","H7","H8","H9","H10","I1","I2","I3"]'),
(4, 2,N'2026-06-08',N'11:00',N'Phòng 3',90, 80000, N'["C4","C5","C6","C7","C8","C9","C10","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","G1","G2","G3","G4","G5","G6","G7","A8","A10"]'),
(5, 2,N'2026-06-08',N'16:00',N'Phòng 2',80, 80000, N'["B5","B6","B7","B8","B9","B10","C1","C2","C3","C4","C5","C6","C7","C8","C9","C10","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","G1","G2","G3","G4","G5","G6","A6","A7"]'),
(6, 3,N'2026-06-08',N'20:00',N'Phòng 4',60, 90000, N'["C6","C7","C8","C9","C10","D1","D2","D3","D4","D5"]'),
(7, 4,N'2026-06-12',N'09:00',N'Phòng 1',100,80000, N'["E8","E9","E10","F1","F2","F3"]'),
(8, 4,N'2026-06-08',N'20:00',N'Phòng 3',90, 100000,N'["C4","C5","C6","C7","C8","C9","C10","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","G1","G2","G3","G4","G5","G6","G7","G8"]'),
(9, 5,N'2026-06-08',N'18:00',N'Phòng 2',80, 80000, N'["A8","A9","A10","B1","B2","B3","B4","B5","B6","B7","B8","B9","B10","C1","C2","C3","C4","C5","C6","C7","C8","C9","C10","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","G1","G2","G3","G4","G5","G6","G7","G8","G9","G10","H1","H2","H3","H4"]'),
(10,6,N'2026-06-08',N'13:00',N'Phòng 5',70, 80000, N'["C4","C5","C6","C7","C8","C9","C10","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","E1","E2","E3","E4","E5","E6","E7","E8"]'),
(11,7,N'2026-06-08',N'15:00',N'Phòng 5',70, 70000, N'["A6","A7","A8","A9","A10","B1","B2","B3","B4","B5","B6","B7","B8","B9","B10","C1","C2","C3","C4","C5","C6","C7","C8","C9","C10","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","G1","G2","G3","G4","G5"]'),
(12,8,N'2026-06-08',N'17:30',N'Phòng 1',100,100000,N'["B1","B2","B3","B4","B5","B6","B7","B8","B9","B10","C1","C2","C3","C4","C5","C6","C7","C8","C9","C10","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","E1","E2","E3","E4","E5","E6","E7","E8","E9","E10","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","G1","G2","G3","G4","G5","G6","G7","G8","G9","G10","H1","H2","H3","H4","H5","H6","H7","H8","H9","H10","I1","I2","I3","I4","I5","I6","I7","I8","I9","I10"]'),
(13,8,N'2026-04-15',N'21:00',N'Phòng 4',60, 100000,N'["C1","C2","C3","C4","C5","C6","C7","C8","C9","C10","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10"]'),
(14,3,N'2026-06-06',N'20:00',N'Phòng 2',80, 90000, N'["E5","E6","A6","A7","A8","A9"]'),
(15,1,N'2026-07-06',N'19:00',N'Phòng 1',100,80000, N'["D3","D4","D5","A7","A8","D7","D8","C10","D10","F1","F4","F9","G1","G3","G9","H1","H8"]'),
(16,2,N'2026-04-22',N'04:30',N'Phòng 1',100,80000, N'["A6","A7","A8","B6","B7"]');
SET IDENTITY_INSERT showtimes OFF;
GO

-- BOOKINGS
SET IDENTITY_INSERT bookings ON;
INSERT INTO bookings (id,user_id,showtime_id,seat_nums,total_price,original_price,discount,voucher_code,status,created_at) VALUES
(1, 2,1, N'["A7","A8"]',                                              160000,160000,0,     NULL,          N'CONFIRMED',N'2026-04-10'),
(2, 2,7, N'["A10"]',                                                   80000, 80000,0,     NULL,          N'CANCELLED',N'2026-04-10'),
(3, 2,5, N'["A6","A7"]',                                              160000,160000,0,     NULL,          N'CANCELLED',N'2026-04-10'),
(4, 5,4, N'["B8","B9"]',                                              160000,160000,0,     NULL,          N'CONFIRMED',N'2026-04-13'),
(5, 6,14,N'["A9"]',                                                    90000, 90000,0,     NULL,          N'CONFIRMED',N'2026-04-15'),
(6, 3,14,N'["E5","E6"]',                                              180000,180000,0,     NULL,          N'CONFIRMED',N'2026-04-05'),
(7, 2,3, N'["B1","B2","B3"]',                                         300000,300000,0,     NULL,          N'CANCELLED',N'2026-04-12'),
(8, 3,2, N'["C5"]',                                                    80000, 80000,0,     NULL,          N'CANCELLED',N'2026-04-11'),
(9, 6,14,N'["A6","A7","A8"]',                                         204000,240000,36000, N'COMBO3',     N'CONFIRMED',N'2026-04-21'),
(10,2,16,N'["A6","A7","A8","B6","B7"]',                               400000,400000,0,     NULL,          N'CANCELLED',N'2026-04-21'),
(11,2,16,N'["C6","C7","C8","D6","D7","D8"]',                          430000,480000,50000, N'WELCOME20',  N'CANCELLED',N'2026-04-21'),
(12,2,16,N'["B6"]',                                                    80000, 80000,0,     NULL,          N'CONFIRMED',N'2026-04-22'),
(13,7,15,N'["F7","F8","F9"]',                                         204000,240000,36000, N'COMBO3',     N'CONFIRMED',N'2026-04-23'),
(14,6,15,N'["C10"]',                                                   80000, 80000,0,     NULL,          N'CONFIRMED',N'2026-07-01'),
(15,6,15,N'["D10","F1","F4","F9","G1","G3","G9","H1","H8"]',          720000,720000,0,     NULL,          N'CONFIRMED',N'2026-07-01');
SET IDENTITY_INSERT bookings OFF;
GO

-- REVIEWS
SET IDENTITY_INSERT reviews ON;
INSERT INTO reviews (id,movie_id,user_id,rating,comment,hidden,created_at,updated_at) VALUES
(1,1,3,5,N'Một bộ phim siêu phẩm! Cảnh chiến đấu cuối cùng rất hoành tráng và đầy cảm xúc.',0,N'2026-04-06',NULL),
(2,1,2,5,N'phim hay',  0,N'2026-04-10',N'2026-04-23'),
(3,3,3,5,N'fds',       1,N'2026-04-10',N'2026-04-17'),
(4,2,2,1,N'phim như c',0,N'2026-04-20',N'2026-04-20');
SET IDENTITY_INSERT reviews OFF;
GO

-- CONTACT MESSAGES
SET IDENTITY_INSERT contact_messages ON;
INSERT INTO contact_messages (id,name,email,phone,subject,message,user_id,status,admin_reply,created_at,replied_at) VALUES
(1,N'Nguyễn Văn A',   N'nguyenvana@gmail.com',   N'0123456789', N'feedback',N'Tôi rất hài lòng với dịch vụ của rạp. Chất lượng âm thanh và hình ảnh rất tốt.',2,N'replied',N'Cảm ơn bạn đã góp ý. Chúng tôi sẽ tiếp tục cải thiện chất lượng dịch vụ.',N'2026-04-20',N'2026-04-20'),
(2,N'Nguyễn Văn A',   N'nguyenvana@gmail.com',   N'11111111110',N'booking',  N'dịch vụ như c',                                                                   2,N'replied',N'aaa',                                                                        N'2026-04-21',N'2026-04-22'),
(3,N'Nguyễn Văn A',   N'nguyenvana@gmail.com',   N'11111111110',N'booking',  N'vé tôi ko đặt đc',                                                                2,N'replied',N'thắc mắc gì lắm thế',                                                        N'2026-04-21',N'2026-04-22'),
(4,N'Hoàng Minh Hiếu',N'minhhieuh707@gmail.com', N'0983816508', N'booking',  N'Không đặt được vé',                                                               7,N'replied',N'để xem xét',                                                                 N'2026-04-23',N'2026-04-23');
SET IDENTITY_INSERT contact_messages OFF;
GO

-- =====================================================
-- BUOC 6: TAO LAI UNIQUE CONSTRAINTS & FOREIGN KEYS
-- =====================================================

-- Unique constraints
ALTER TABLE users    ADD CONSTRAINT UKr43af9ap4edm43mmtq01oddj6 UNIQUE (username);
ALTER TABLE vouchers ADD CONSTRAINT UK30ftp2biebbvpik8e49wlmady UNIQUE (code);
ALTER TABLE reviews  ADD CONSTRAINT UKovijrmb7g6cvqvlgr25vb8r98 UNIQUE (movie_id, user_id);
GO

-- Foreign keys
ALTER TABLE showtimes        ADD CONSTRAINT FKeltpyuei1d5g3n6ikpsjwwil6 FOREIGN KEY (movie_id)    REFERENCES movies(id);
ALTER TABLE bookings         ADD CONSTRAINT FKc7q4u7vleq90vlvy8c7lmwtyl FOREIGN KEY (showtime_id)  REFERENCES showtimes(id);
ALTER TABLE bookings         ADD CONSTRAINT FKeyog2oic85xg7hsu2je2lx3s6 FOREIGN KEY (user_id)      REFERENCES users(id);
ALTER TABLE contact_messages ADD CONSTRAINT FKj305kltauaydco2n00yr55nbk FOREIGN KEY (user_id)      REFERENCES users(id);
ALTER TABLE reviews          ADD CONSTRAINT FK87tlqya0rq8ijfjscldpvvdyq  FOREIGN KEY (movie_id)    REFERENCES movies(id);
ALTER TABLE reviews          ADD CONSTRAINT FKcgy7qjc1r99dp117y9en6lxye  FOREIGN KEY (user_id)     REFERENCES users(id);
GO

PRINT '=== HOAN THANH TOAN BO! Tat ca cot NVARCHAR, data tieng Viet chinh xac, FK duoc khoi phuc ===';
GO
