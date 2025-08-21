-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql.railway.internal:3306
-- Generation Time: Aug 20, 2025 at 11:29 AM
-- Server version: 9.4.0
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `swimming_pool_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `lockers`
--

CREATE TABLE `lockers` (
  `id` int NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('available','maintenance','unavailable') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lockers`
--

INSERT INTO `lockers` (`id`, `code`, `location`, `status`, `created_at`, `updated_at`) VALUES
(1, 'L01', 'Zone A', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:45'),
(2, 'L02', 'Zone A', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:49'),
(3, 'L03', 'Zone A', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(4, 'L04', 'Zone A', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(5, 'L05', 'Zone A', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:39'),
(6, 'L06', 'Zone A', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(7, 'L07', 'Zone A', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(8, 'L08', 'Zone A', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(9, 'L09', 'Zone A', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(10, 'L10', 'Zone A', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(11, 'L11', 'Zone B', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54'),
(12, 'L12', 'Zone B', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54'),
(13, 'L13', 'Zone B', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(14, 'L14', 'Zone B', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(15, 'L15', 'Zone B', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54'),
(16, 'L16', 'Zone B', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(17, 'L17', 'Zone B', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(18, 'L18', 'Zone B', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(19, 'L19', 'Zone B', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(20, 'L20', 'Zone B', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(21, 'L21', 'Zone C', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54'),
(22, 'L22', 'Zone C', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54'),
(23, 'L23', 'Zone C', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(24, 'L24', 'Zone C', 'available', '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(25, 'L25', 'Zone C', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54'),
(26, 'L26', 'Zone C', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54'),
(27, 'L27', 'Zone C', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54'),
(28, 'L28', 'Zone C', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54'),
(29, 'L29', 'Zone C', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54'),
(30, 'L30', 'Zone C', 'available', '2025-08-19 10:28:06', '2025-08-19 14:59:54');

-- --------------------------------------------------------

--
-- Table structure for table `locker_reservations`
--

CREATE TABLE `locker_reservations` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `locker_id` int NOT NULL,
  `reservation_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `locker_reservations`
--

INSERT INTO `locker_reservations` (`id`, `user_id`, `locker_id`, `reservation_date`, `start_time`, `end_time`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(4, 7, 10, '2025-08-25', '00:00:00', '23:59:59', 'confirmed', NULL, '2025-08-19 13:49:15', '2025-08-19 13:55:33');

-- --------------------------------------------------------

--
-- Table structure for table `memberships`
--

CREATE TABLE `memberships` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `membership_type_id` int NOT NULL,
  `expires_at` datetime NOT NULL,
  `status` enum('active','expired','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `memberships`
--

INSERT INTO `memberships` (`id`, `user_id`, `membership_type_id`, `expires_at`, `status`, `created_at`, `updated_at`) VALUES
(3, 7, 1, '2025-08-19 11:06:05', 'active', '2025-08-19 11:06:05', '2025-08-19 11:49:41'),
(4, 7, 2, '2026-08-19 21:51:38', 'active', '2025-08-19 13:41:07', '2025-08-19 22:21:49');

-- --------------------------------------------------------

--
-- Table structure for table `membership_types`
--

CREATE TABLE `membership_types` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `membership_types`
--

INSERT INTO `membership_types` (`id`, `name`, `description`, `price`, `duration_days`, `created_at`, `updated_at`) VALUES
(1, 'รายครั้ง', 'ชำระเงินสำหรับเใช้งานครั้งดียว', 0.00, 1, '2025-08-19 10:28:05', '2025-08-19 15:25:57'),
(2, 'รายปี', 'สมาชิกรายปี', 0.00, 365, '2025-08-19 10:28:05', '2025-08-19 14:23:07');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `is_read`, `created_at`, `updated_at`) VALUES
(5, 7, 'ปิดปรับปรุง', 'วันที่ 22 สิงหาคม 2568', 0, '2025-08-19 15:50:50', '2025-08-19 15:50:50');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','completed','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_method` enum('credit_card','bank_transfer','cash','qr_code','system') COLLATE utf8mb4_unicode_ci DEFAULT 'system',
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slip_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `user_id`, `amount`, `status`, `payment_method`, `transaction_id`, `slip_url`, `created_at`, `updated_at`) VALUES
(9, 7, 30.00, 'completed', 'bank_transfer', 'LKR4_1755611355845', 'https://res.cloudinary.com/djndjdkj3/image/upload/v1755611358/slips/slip_9_1755611356505.png', '2025-08-19 13:49:16', '2025-08-19 14:16:29'),
(10, 7, 300.00, 'pending', 'bank_transfer', 'TXN1755640296785', 'https://res.cloudinary.com/djndjdkj3/image/upload/v1755640319/slips/slip_10_1755640314128.png', '2025-08-19 21:51:36', '2025-08-19 21:52:00');

-- --------------------------------------------------------

--
-- Table structure for table `pool_resources`
--

CREATE TABLE `pool_resources` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `capacity` int NOT NULL,
  `status` enum('available','maintenance','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pool_resources`
--

INSERT INTO `pool_resources` (`id`, `name`, `description`, `capacity`, `status`, `created_at`, `updated_at`) VALUES
(1, 'สระหลัก', 'สระว่ายน้ำหลักขนาดใหญ่ ความยาว 25 เมตร เหมาะสำหรับว่ายน้ำออกกำลังกาย', 60, 'available', '2025-08-19 10:28:05', '2025-08-19 14:03:26'),
(2, 'สระเด็ก', 'สระสำหรับเด็กและผู้เริ่มต้น ความลึกไม่เกิน 1.2 เมตร', 20, 'closed', '2025-08-19 10:28:05', '2025-08-19 14:03:17');

-- --------------------------------------------------------

--
-- Table structure for table `pool_schedules`
--

CREATE TABLE `pool_schedules` (
  `id` int NOT NULL,
  `pool_resource_id` int NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') COLLATE utf8mb4_unicode_ci NOT NULL,
  `open_time` time NOT NULL,
  `close_time` time NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pool_schedules`
--

INSERT INTO `pool_schedules` (`id`, `pool_resource_id`, `day_of_week`, `open_time`, `close_time`, `is_active`, `created_at`, `updated_at`) VALUES
(8, 2, 'monday', '08:00:00', '20:00:00', 1, '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(9, 2, 'tuesday', '08:00:00', '20:00:00', 1, '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(10, 2, 'wednesday', '08:00:00', '20:00:00', 1, '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(11, 2, 'thursday', '08:00:00', '20:00:00', 1, '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(12, 2, 'friday', '08:00:00', '20:00:00', 1, '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(13, 2, 'saturday', '08:00:00', '20:00:00', 1, '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(14, 2, 'sunday', '08:00:00', '20:00:00', 1, '2025-08-19 10:28:06', '2025-08-19 10:28:06'),
(15, 1, 'monday', '13:00:00', '21:00:00', 0, '2025-08-19 14:03:06', '2025-08-19 14:03:06'),
(16, 1, 'tuesday', '13:00:00', '21:00:00', 1, '2025-08-19 14:03:06', '2025-08-19 14:03:06'),
(17, 1, 'wednesday', '13:00:00', '21:00:00', 1, '2025-08-19 14:03:06', '2025-08-19 14:03:06'),
(18, 1, 'thursday', '13:00:00', '21:00:00', 1, '2025-08-19 14:03:06', '2025-08-19 14:03:06'),
(19, 1, 'friday', '13:00:00', '21:00:00', 1, '2025-08-19 14:03:07', '2025-08-19 14:03:07'),
(20, 1, 'saturday', '13:00:00', '21:00:00', 1, '2025-08-19 14:03:07', '2025-08-19 14:03:07'),
(21, 1, 'sunday', '13:00:00', '21:00:00', 1, '2025-08-19 14:03:07', '2025-08-19 14:03:07');

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `pool_resource_id` int NOT NULL,
  `reservation_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`id`, `user_id`, `pool_resource_id`, `reservation_date`, `start_time`, `end_time`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(7, 7, 1, '2025-08-25', '13:00:00', '21:00:00', 'completed', 'ออกกำลังกาย', '2025-08-19 13:45:44', '2025-08-19 14:51:38');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`, `updated_at`) VALUES
('account_name', 'สระว่ายน้ำโรจนากร มหาวิทยาลัยมหาสารคาม', NULL, '2025-08-19 14:29:29'),
('bank_account_number', '123-456-7890', 'เลขที่บัญชีธนาคารสำหรับรับชำระเงิน', '2025-08-19 10:28:06'),
('bank_name', 'ธนาคารกรุงไทย', NULL, '2025-08-19 14:29:29'),
('contact_email', 'PoolManagement@msu.ac.th', NULL, '2025-08-19 14:28:19'),
('contact_phone', '0956139453', NULL, '2025-08-19 14:27:26'),
('locker_price', '30', 'ราคาการจองตู้เก็บของต่อครั้ง (บาท)', '2025-08-19 13:48:30'),
('max_reservation_days', '7', 'จำนวนวันสูงสุดที่สามารถจองล่วงหน้าได้', '2025-08-19 10:28:06'),
('pool_name', 'สระว่ายน้ำโรจนากร', 'ชื่อสระว่ายน้ำ', '2025-08-19 10:28:06'),
('pool_price', '50', 'ราคาการจองสระว่ายน้ำต่อครั้ง (บาท)', '2025-08-19 10:28:06'),
('reservation_cancel_hours', '2', NULL, '2025-08-19 14:27:26');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `date_of_birth` date DEFAULT NULL,
  `id_card` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_category_id` int DEFAULT NULL,
  `organization` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `age` int DEFAULT NULL,
  `medical_condition` text COLLATE utf8mb4_unicode_ci,
  `emergency_contact_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_relationship` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `status` enum('active','inactive','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `phone`, `address`, `date_of_birth`, `id_card`, `user_category_id`, `organization`, `age`, `medical_condition`, `emergency_contact_name`, `emergency_contact_relationship`, `emergency_contact_phone`, `profile_photo`, `member_number`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin', 'admin@pool.com', '$2a$12$hHKT9f.Bc/ihXXLN5wXAH.dRYKjMJ4yz8Li01t.VUjD/8UC23p4de', 'ผู้ดูแล', 'ระบบ', '02-123-4567', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'admin', 'active', '2025-08-19 10:28:05', '2025-08-19 13:01:33'),
(7, 'naphat', '65011211099@msu.ac.th', '$2a$10$oR1rmPpHHLHs1Xb043rQ8.lMOoV6r04xCfBNtEDaesoxGvLYHdhsS', 'นภัทร', 'จันทรสาขา', '0956193453', 'มหาสารคาม', '2003-09-17', '1419902162597', 3, 'คณะวิทยาการสารสนเทศ', 21, '', 'นางวราพร จันทรสาขา', 'ญาติ', '0992139453', 'https://res.cloudinary.com/djndjdkj3/image/upload/v1755609894/swimming-pool-profiles/i6pjrxmwqrak6wnmqjlu.png', 'MSU01564986', 'user', 'active', '2025-08-19 11:06:04', '2025-08-19 15:33:46');

-- --------------------------------------------------------

--
-- Table structure for table `user_categories`
--

CREATE TABLE `user_categories` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `pay_per_session_price` decimal(10,2) NOT NULL,
  `annual_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_categories`
--

INSERT INTO `user_categories` (`id`, `name`, `description`, `pay_per_session_price`, `annual_price`, `created_at`, `updated_at`) VALUES
(1, 'นักเรียน ร.ร. สาธิต (ฝ่ายประถม) (ก)', 'สำหรับนักเรียนโรงเรียนสาธิตมหาวิทยาลัยมหาสารคาม (ฝ่ายประถม)', 20.00, 300.00, '2025-08-19 10:28:04', '2025-08-19 10:28:04'),
(2, 'นักเรียน ร.ร. สาธิต (ฝ่ายมัธยม) (ข)', 'สำหรับนักเรียนโรงเรียนสาธิตมหาวิทยาลัยมหาสารคาม (ฝ่ายมัธยม)', 30.00, 300.00, '2025-08-19 10:28:04', '2025-08-19 10:28:04'),
(3, 'นิสิตมหาวิทยาลัยมหาสารคาม (ข)', 'สำหรับนิสิตปัจจุบันของมหาวิทยาลัยมหาสารคาม', 30.00, 300.00, '2025-08-19 10:28:04', '2025-08-19 10:28:04'),
(4, 'บุคลากรมหาวิทยาลัยมหาสารคาม (ข)', 'สำหรับบุคลากรของมหาวิทยาลัยมหาสารคาม', 30.00, 300.00, '2025-08-19 10:28:04', '2025-08-19 10:28:04'),
(5, 'บุคคลภายนอกทั่วไป (เด็ก) (ค)', 'สำหรับบุคคลภายนอกที่มีอายุต่ำกว่า 18 ปี', 30.00, 400.00, '2025-08-19 10:28:04', '2025-08-19 10:28:04'),
(6, 'บุคคลภายนอกทั่วไป (ผู้ใหญ่) (ค)', 'สำหรับบุคคลภายนอกทั่วไป', 50.00, 500.00, '2025-08-19 10:28:04', '2025-08-19 10:28:04');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `lockers`
--
ALTER TABLE `lockers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `locker_reservations`
--
ALTER TABLE `locker_reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_locker_reservation_date` (`locker_id`,`reservation_date`);

--
-- Indexes for table `memberships`
--
ALTER TABLE `memberships`
  ADD PRIMARY KEY (`id`),
  ADD KEY `membership_type_id` (`membership_type_id`),
  ADD KEY `idx_memberships_user` (`user_id`,`status`);

--
-- Indexes for table `membership_types`
--
ALTER TABLE `membership_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_notifications` (`user_id`,`is_read`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_payments` (`user_id`),
  ADD KEY `idx_transaction_id` (`transaction_id`);

--
-- Indexes for table `pool_resources`
--
ALTER TABLE `pool_resources`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pool_schedules`
--
ALTER TABLE `pool_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pool_resource_id` (`pool_resource_id`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reservation_date` (`reservation_date`),
  ADD KEY `idx_user_reservations` (`user_id`,`reservation_date`),
  ADD KEY `idx_reservations_pool_date` (`pool_resource_id`,`reservation_date`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `member_number` (`member_number`),
  ADD KEY `user_category_id` (`user_category_id`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_username` (`username`);

--
-- Indexes for table `user_categories`
--
ALTER TABLE `user_categories`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `lockers`
--
ALTER TABLE `lockers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `locker_reservations`
--
ALTER TABLE `locker_reservations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `memberships`
--
ALTER TABLE `memberships`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `membership_types`
--
ALTER TABLE `membership_types`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `pool_resources`
--
ALTER TABLE `pool_resources`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `pool_schedules`
--
ALTER TABLE `pool_schedules`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user_categories`
--
ALTER TABLE `user_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `locker_reservations`
--
ALTER TABLE `locker_reservations`
  ADD CONSTRAINT `locker_reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `locker_reservations_ibfk_2` FOREIGN KEY (`locker_id`) REFERENCES `lockers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `memberships`
--
ALTER TABLE `memberships`
  ADD CONSTRAINT `memberships_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `memberships_ibfk_2` FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pool_schedules`
--
ALTER TABLE `pool_schedules`
  ADD CONSTRAINT `pool_schedules_ibfk_1` FOREIGN KEY (`pool_resource_id`) REFERENCES `pool_resources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`pool_resource_id`) REFERENCES `pool_resources` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`user_category_id`) REFERENCES `user_categories` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
