-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 26, 2026 at 09:28 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cec_exam_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `administrators`
--

CREATE TABLE `administrators` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('super_admin','admin') DEFAULT 'admin',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `administrators`
--

INSERT INTO `administrators` (`id`, `name`, `email`, `password_hash`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'System Administrator', 'admin@itproctool.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(2, 'IT Admin', 'it.admin@itproctool.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `created_at`) VALUES
(1, 'Meals', '2025-10-29 14:58:36'),
(2, 'Appetizer', '2025-10-29 14:58:36'),
(3, 'Burger', '2025-10-29 14:58:36'),
(4, 'Fries', '2025-10-29 14:58:36'),
(5, 'Noodles', '2025-10-29 14:58:36'),
(6, 'Canton', '2025-10-29 14:58:36'),
(7, 'Beverages', '2025-10-29 14:58:36');

-- --------------------------------------------------------

--
-- Table structure for table `exams`
--

CREATE TABLE `exams` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `form_url` text NOT NULL,
  `duration_minutes` int(11) DEFAULT 60,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `teacher_id` int(11) NOT NULL,
  `unique_id` varchar(20) NOT NULL,
  `status` enum('draft','active','completed','cancelled') DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `exams`
--

INSERT INTO `exams` (`id`, `title`, `description`, `form_url`, `duration_minutes`, `start_time`, `end_time`, `teacher_id`, `unique_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Database Systems Midterm', 'Midterm examination covering database design and SQL', 'https://forms.google.com/sample1', 120, NULL, NULL, 1, 'EXAM001', 'completed', '2025-09-25 03:28:10', '2025-09-25 03:31:20'),
(2, 'Programming Fundamentals Quiz', 'Weekly quiz on programming concepts', 'https://forms.google.com/sample2', 60, NULL, NULL, 2, 'EXAM002', 'draft', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(3, 'Data Structures Final', 'Final examination on data structures and algorithms', 'https://forms.google.com/sample3', 180, NULL, NULL, 3, 'EXAM003', 'completed', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(4, 'survey', 'asd', 'https://docs.google.com/forms/d/e/1FAIpQLSfheAWc2_SwzseI0X0T6CQIzeDkQdwJwN4OsM9031-3DINoPA/viewform?usp=dialog', 60, '2025-09-25 16:31:00', '2025-09-26 09:36:00', 1, 'SURV065932', 'active', '2025-09-25 03:31:05', '2025-09-25 06:46:00');

-- --------------------------------------------------------

--
-- Table structure for table `exam_sessions`
--

CREATE TABLE `exam_sessions` (
  `id` int(11) NOT NULL,
  `exam_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `session_token` varchar(255) DEFAULT NULL,
  `start_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_time` timestamp NULL DEFAULT NULL,
  `status` enum('active','completed','terminated') DEFAULT 'active',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `exam_sessions`
--

INSERT INTO `exam_sessions` (`id`, `exam_id`, `student_id`, `session_token`, `start_time`, `end_time`, `status`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 4, 1, '4-1-1769009890583', '2026-01-21 15:38:10', NULL, 'active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-21 15:38:10'),
(2, 4, 1, '4-1-1769414483144', '2026-01-26 08:01:23', NULL, 'active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-26 08:01:23'),
(3, 4, 1, '4-1-1769414818165', '2026-01-26 08:06:58', NULL, 'active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-26 08:06:58'),
(4, 4, 1, '4-1-1769415007106', '2026-01-26 08:10:07', NULL, 'active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-26 08:10:07'),
(5, 4, 1, '4-1-1769415435153', '2026-01-26 08:17:15', NULL, 'active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-26 08:17:15'),
(6, 4, 1, '4-1-1769415555491', '2026-01-26 08:19:15', NULL, 'active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-26 08:19:15'),
(7, 4, 1, '4-1-1769415648393', '2026-01-26 08:20:48', NULL, 'active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-26 08:20:48'),
(8, 4, 1, '4-1-1769415657114', '2026-01-26 08:20:57', NULL, 'active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-26 08:20:57'),
(9, 4, 1, '4-1-1769415766818', '2026-01-26 08:22:46', NULL, 'active', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '2026-01-26 08:22:46');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `menu_item_id`, `quantity`, `last_updated`) VALUES
(1, 1, 50, '2025-10-29 14:58:36'),
(2, 2, 40, '2025-10-29 14:58:36'),
(3, 3, 30, '2025-10-29 14:58:36'),
(4, 4, 25, '2025-10-29 14:58:36'),
(5, 5, 35, '2025-10-29 14:58:36'),
(6, 6, 20, '2025-10-29 14:58:36'),
(7, 7, 25, '2025-10-29 14:58:36'),
(8, 8, 15, '2025-10-29 14:58:36'),
(9, 9, 20, '2025-10-29 14:58:36'),
(10, 10, 18, '2025-10-29 14:58:36'),
(11, 11, 22, '2025-10-29 14:58:36'),
(12, 12, 20, '2025-10-29 14:58:36'),
(13, 13, 18, '2025-10-29 14:58:36'),
(14, 14, 22, '2025-10-29 14:58:36'),
(15, 15, 30, '2025-10-29 14:58:36'),
(16, 16, 25, '2025-10-29 14:58:36'),
(17, 17, 20, '2025-10-29 14:58:36'),
(18, 18, 40, '2025-10-29 14:58:36'),
(19, 19, 40, '2025-10-29 14:58:36'),
(20, 20, 35, '2025-10-29 14:58:36'),
(21, 21, 50, '2025-10-29 14:58:36'),
(22, 22, 40, '2025-10-29 14:58:36'),
(23, 23, 50, '2025-10-29 14:58:36'),
(24, 24, 40, '2025-10-29 14:58:36'),
(25, 25, 30, '2025-10-29 14:58:36'),
(26, 26, 30, '2025-10-29 14:58:36'),
(27, 27, 30, '2025-10-29 14:58:36'),
(28, 28, 25, '2025-10-29 14:58:36'),
(29, 29, 25, '2025-10-29 14:58:36'),
(30, 30, 60, '2025-10-29 14:58:36'),
(31, 31, 50, '2025-10-29 14:58:36'),
(32, 32, 40, '2025-10-29 14:58:36'),
(33, 33, 40, '2025-10-29 14:58:36'),
(34, 34, 40, '2025-10-29 14:58:36'),
(35, 35, 40, '2025-10-29 14:58:36'),
(36, 36, 30, '2025-10-29 14:58:36');

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `available` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`id`, `category_id`, `name`, `price`, `available`, `created_at`) VALUES
(1, 1, 'Rice', 15.00, 1, '2025-10-29 14:58:36'),
(2, 1, 'Siomai', 10.00, 1, '2025-10-29 14:58:36'),
(3, 1, 'Spaghetti', 30.00, 1, '2025-10-29 14:58:36'),
(4, 1, 'Hotdog', 20.00, 1, '2025-10-29 14:58:36'),
(5, 1, 'Longganisa', 10.00, 1, '2025-10-29 14:58:36'),
(6, 1, 'Spam', 20.00, 1, '2025-10-29 14:58:36'),
(7, 1, 'Chorizo', 20.00, 1, '2025-10-29 14:58:36'),
(8, 1, 'Porkchop', 60.00, 1, '2025-10-29 14:58:36'),
(9, 1, 'Chicken Fillet', 55.00, 1, '2025-10-29 14:58:36'),
(10, 1, 'Fish Fillet', 45.00, 1, '2025-10-29 14:58:36'),
(11, 1, 'Fried Chicken', 60.00, 1, '2025-10-29 14:58:36'),
(12, 1, 'Chicken Fillet W/rice', 55.00, 1, '2025-10-29 14:58:36'),
(13, 1, 'Fish Fillet W/rice', 45.00, 1, '2025-10-29 14:58:36'),
(14, 1, 'Fried Chicken W/rice', 60.00, 1, '2025-10-29 14:58:36'),
(15, 2, 'Corn', 10.00, 1, '2025-10-29 14:58:36'),
(16, 2, 'Banana Chips', 20.00, 1, '2025-10-29 14:58:36'),
(17, 2, 'Chicharon', 40.00, 1, '2025-10-29 14:58:36'),
(18, 3, 'W/cheese', 30.00, 1, '2025-10-29 14:58:36'),
(19, 3, 'W/egg', 30.00, 1, '2025-10-29 14:58:36'),
(20, 3, 'W/cheese and egg', 40.00, 1, '2025-10-29 14:58:36'),
(21, 4, 'Regular Cheese', 40.00, 1, '2025-10-29 14:58:36'),
(22, 4, 'Large Cheese', 60.00, 1, '2025-10-29 14:58:36'),
(23, 4, 'Regular BBQ', 40.00, 1, '2025-10-29 14:58:36'),
(24, 4, 'Large BBQ', 60.00, 1, '2025-10-29 14:58:36'),
(25, 5, 'Jjampong', 40.00, 1, '2025-10-29 14:58:36'),
(26, 5, 'Sutanghon', 40.00, 1, '2025-10-29 14:58:36'),
(27, 5, 'Bulalo', 40.00, 1, '2025-10-29 14:58:36'),
(28, 6, 'Spicy Canton', 30.00, 1, '2025-10-29 14:58:36'),
(29, 6, 'Calamansi Canton', 30.00, 1, '2025-10-29 14:58:36'),
(30, 7, 'Water', 20.00, 1, '2025-10-29 14:58:36'),
(31, 7, 'Water 35', 35.00, 1, '2025-10-29 14:58:36'),
(32, 7, 'Coke', 25.00, 1, '2025-10-29 14:58:36'),
(33, 7, 'C2', 25.00, 1, '2025-10-29 14:58:36'),
(34, 7, 'Sprite', 25.00, 1, '2025-10-29 14:58:36'),
(35, 7, 'Nestea', 25.00, 1, '2025-10-29 14:58:36'),
(36, 7, 'Milo', 25.00, 1, '2025-10-29 14:58:36'),
(37, 7, 'Nescafe', 30.00, 1, '2025-10-29 14:58:36'),
(38, 2, 'idk', 123.00, 1, '2025-10-29 15:18:38'),
(39, 1, 'idk', 99.00, 1, '2025-10-30 03:45:29');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','preparing','ready','cancelled') DEFAULT 'pending',
  `total_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `order_date`, `status`, `total_price`) VALUES
(1, 2, '2025-10-29 15:05:48', 'pending', 15.00),
(2, 4, '2025-10-30 03:52:56', 'pending', 10.00),
(3, 4, '2025-10-30 03:53:44', 'pending', 99.00),
(4, 4, '2025-10-30 03:55:24', 'pending', 60.00),
(5, 2, '2025-10-30 03:55:50', 'pending', 99.00),
(6, 4, '2025-10-30 04:09:52', 'pending', 10.00),
(7, 4, '2025-10-30 04:10:11', 'pending', 99.00);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `menu_item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `quantity`, `price`) VALUES
(1, 1, 1, 1, 15.00),
(2, 2, 2, 1, 10.00),
(3, 3, 39, 1, 99.00),
(4, 4, 14, 1, 60.00),
(5, 5, 39, 1, 99.00),
(6, 6, 2, 1, 10.00),
(7, 7, 39, 1, 99.00);

-- --------------------------------------------------------

--
-- Table structure for table `proctoring_settings`
--

CREATE TABLE `proctoring_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `proctoring_settings`
--

INSERT INTO `proctoring_settings` (`id`, `setting_key`, `setting_value`, `description`, `updated_by`, `updated_at`) VALUES
(1, 'violation_threshold', '3', 'Maximum violations before automatic termination', NULL, '2025-09-25 03:28:10'),
(2, 'tab_switch_enabled', 'true', 'Enable tab switching detection', NULL, '2025-09-25 03:28:10'),
(3, 'right_click_disabled', 'true', 'Disable right-click during exams', NULL, '2025-09-25 03:28:10'),
(4, 'copy_paste_disabled', 'true', 'Disable copy-paste during exams', NULL, '2025-09-25 03:28:10'),
(5, 'fullscreen_required', 'true', 'Require fullscreen mode during exams', NULL, '2025-09-25 03:28:10');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `year_level` int(11) DEFAULT NULL,
  `status` enum('active','inactive','graduated') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `name`, `student_id`, `email`, `department`, `year_level`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Alice Johnson', 'STU001', 'alice.johnson@student.cec.edu', 'Computer Science', 3, 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(2, 'Bob Wilson', 'STU002', 'bob.wilson@student.cec.edu', 'Information Technology', 2, 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(3, 'Carol Davis', 'STU003', 'carol.davis@student.cec.edu', 'Computer Science', 4, 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(4, 'David Brown', 'STU004', 'david.brown@student.cec.edu', 'Information Technology', 1, 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(5, 'Eva Martinez', 'STU005', 'eva.martinez@student.cec.edu', 'Computer Science', 3, 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(6, 'Frank Taylor', 'STU006', 'frank.taylor@student.cec.edu', 'Computer Engineering', 2, 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(7, 'Grace Lee', 'STU007', 'grace.lee@student.cec.edu', 'Software Engineering', 4, 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(8, 'Henry Chen', 'STU008', 'henry.chen@student.cec.edu', 'Information Technology', 3, 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(9, 'Ivy Rodriguez', 'STU009', 'ivy.rodriguez@student.cec.edu', 'Computer Science', 1, 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(10, 'Jack Thompson', 'STU010', 'jack.thompson@student.cec.edu', 'Computer Engineering', 2, 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10');

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL,
  `user_type` enum('admin','teacher','student') NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_logs`
--

INSERT INTO `system_logs` (`id`, `user_type`, `user_id`, `action`, `description`, `ip_address`, `user_agent`, `timestamp`) VALUES
(1, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2025-09-25 03:29:21'),
(2, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2025-09-25 03:29:37'),
(3, 'admin', 1, 'login', 'Admin login: admin@itproctool.edu', '::1', NULL, '2025-09-25 03:41:10'),
(4, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2025-09-25 03:45:06'),
(5, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2025-09-25 06:18:32'),
(6, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2025-09-25 06:43:56'),
(7, 'admin', 1, 'login', 'Admin login: admin@itproctool.edu', '::1', NULL, '2025-09-25 06:48:22'),
(8, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 13:53:31'),
(9, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 13:54:13'),
(10, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 13:59:00'),
(11, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 14:00:23'),
(12, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 14:00:37'),
(13, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 14:02:04'),
(14, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 14:03:37'),
(15, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 14:04:01'),
(16, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 14:04:11'),
(17, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 14:32:54'),
(18, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 14:36:14'),
(19, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 14:38:27'),
(20, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 14:48:08'),
(21, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 14:48:35'),
(22, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 15:03:55'),
(23, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 15:04:17'),
(24, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 15:05:24'),
(25, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 15:10:56'),
(26, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 15:24:49'),
(27, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 15:25:19'),
(28, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-21 15:37:29'),
(29, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-21 15:38:02'),
(30, 'teacher', 1, 'login', 'Teacher login: teacher@cec.edu', '::1', NULL, '2026-01-26 08:00:43'),
(31, 'student', 1, 'login', 'Student login: STU001', '::1', NULL, '2026-01-26 08:01:15');

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`id`, `name`, `email`, `password_hash`, `department`, `employee_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Dr. John Smith', 'teacher@cec.edu', 'teacher123', 'Computer Science', 'EMP001', 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(2, 'Prof. Sarah Johnson', 'sarah.johnson@cec.edu', 'password123', 'Information Technology', 'EMP002', 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(3, 'Dr. Michael Brown', 'michael.brown@cec.edu', 'password123', 'Computer Engineering', 'EMP003', 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(4, 'Prof. Lisa Davis', 'lisa.davis@cec.edu', 'password123', 'Software Engineering', 'EMP004', 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10'),
(5, 'Dr. Robert Wilson', 'robert.wilson@cec.edu', 'password123', 'Computer Science', 'EMP005', 'active', '2025-09-25 03:28:10', '2025-09-25 03:28:10');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','teacher','staff','admin') NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `name`, `created_at`) VALUES
(1, 'student1', '$2y$10$XspEZoJnCf1RYMio1Ygg2uB23Nja4mrSfRgX9QjDND.CbrZuQFEcG', 'student', 'John Student', '2025-10-29 14:58:36'),
(2, 'teacher1', '$2y$10$HOetT4dGQm0soesPyoXM1.yJmjx1So28NJsOwzxXB0ktyDRXQQH0K', 'teacher', 'Ms. Teacher', '2025-10-29 14:58:36'),
(3, 'staff1', '$2y$10$zkjWQKu8PVzaKJKuKA01u.nYvU.EeSV6PlW6jWpCENsOqUK8xXl0C', 'staff', 'Staff Member', '2025-10-29 14:58:36'),
(4, 's2', '$2y$10$JKH22Eu3uTd8boUyVlUpmOgbXSRzgbGwO047xGewX9gVh26JUwFta', 'student', '12', '2025-10-29 15:00:18'),
(5, 'admin1', '$2y$10$HOetT4dGQm0soesPyoXM1.yJmjx1So28NJsOwzxXB0ktyDRXQQH0K', 'admin', 'Admin User', '2025-10-29 17:55:43');

-- --------------------------------------------------------

--
-- Table structure for table `violations`
--

CREATE TABLE `violations` (
  `id` int(11) NOT NULL,
  `exam_session_id` int(11) DEFAULT NULL,
  `student_name` varchar(255) NOT NULL,
  `exam_title` varchar(255) NOT NULL,
  `violation_type` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `severity` enum('low','medium','high') DEFAULT 'medium',
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `violations`
--

INSERT INTO `violations` (`id`, `exam_session_id`, `student_name`, `exam_title`, `violation_type`, `description`, `severity`, `timestamp`, `metadata`) VALUES
(112, 1, 'Alice Johnson', 'Unknown Exam', 'WINDOW_SWITCH', 'Student switched to another application or window', 'medium', '2026-01-21 07:38:13', NULL),
(113, 1, 'Alice Johnson', 'Unknown Exam', 'WINDOW_SWITCH', 'Student switched to another application or window', 'medium', '2026-01-21 07:38:26', NULL),
(114, 1, 'Alice Johnson', 'Unknown Exam', 'WINDOW_SWITCH', 'Student switched to another application or window', 'medium', '2026-01-21 07:38:40', NULL),
(115, 1, 'Alice Johnson', 'Unknown Exam', 'WINDOW_SWITCH', 'Student switched to another application or window', 'medium', '2026-01-21 07:40:23', NULL),
(116, 1, 'Alice Johnson', 'Unknown Exam', 'RIGHT_CLICK', 'Student attempted to right-click', 'medium', '2026-01-21 07:40:43', NULL),
(117, 1, 'Alice Johnson', 'Unknown Exam', 'RIGHT_CLICK', 'Student attempted to right-click', 'medium', '2026-01-21 07:40:43', NULL),
(118, 1, 'Alice Johnson', 'Unknown Exam', 'COPY_ATTEMPT', 'Student attempted to copy content', 'medium', '2026-01-21 07:40:55', NULL),
(119, 2, 'Alice Johnson', 'Unknown Exam', 'WINDOW_SWITCH', 'Student switched to another application or window', 'medium', '2026-01-26 00:01:25', NULL),
(120, 2, 'Alice Johnson', 'Unknown Exam', 'WINDOW_SWITCH', 'Student switched to another application or window', 'medium', '2026-01-26 00:01:38', NULL),
(121, 3, 'Alice Johnson', 'Unknown Exam', 'WINDOW_SWITCH', 'Student switched to another application or window', 'medium', '2026-01-26 00:06:59', NULL),
(122, 3, 'Alice Johnson', 'Unknown Exam', 'WINDOW_SWITCH', 'Student switched to another application or window', 'medium', '2026-01-26 00:07:27', NULL),
(123, 3, 'Alice Johnson', 'Unknown Exam', 'WINDOW_SWITCH', 'Student switched to another application or window', 'medium', '2026-01-26 00:07:39', NULL),
(124, 3, 'Alice Johnson', 'Unknown Exam', 'TAB_SWITCH', 'Student switched tabs or minimized window', 'medium', '2026-01-26 00:08:28', NULL),
(125, 3, 'Alice Johnson', 'survey', 'TAB_SWITCH', 'Student switched tabs, minimized window, or switched applications', 'medium', '2026-01-26 00:08:43', NULL),
(126, 3, 'Alice Johnson', 'survey', 'TAB_SWITCH', 'Student switched tabs, minimized window, or switched applications', 'medium', '2026-01-26 00:08:55', NULL),
(127, 4, 'Alice Johnson', 'Unknown Exam', 'TAB_SWITCH', 'Student switched tabs, minimized window, or switched applications', 'medium', '2026-01-26 00:10:14', NULL),
(128, 4, 'Alice Johnson', 'Unknown Exam', 'TAB_SWITCH', 'Student switched tabs, minimized window, or switched applications', 'medium', '2026-01-26 00:10:21', NULL),
(129, 4, 'Alice Johnson', 'Unknown Exam', 'TAB_SWITCH', 'Student switched tabs, minimized window, or switched applications', 'medium', '2026-01-26 00:10:23', NULL),
(130, 4, 'Alice Johnson', 'Unknown Exam', 'RIGHT_CLICK', 'Student attempted to right-click', 'medium', '2026-01-26 00:11:30', NULL),
(131, 4, 'Alice Johnson', 'Unknown Exam', 'RIGHT_CLICK', 'Student attempted to right-click', 'medium', '2026-01-26 00:11:30', NULL),
(132, 4, 'Alice Johnson', 'Unknown Exam', 'FULLSCREEN_EXIT', 'Student exited fullscreen mode during exam', 'medium', '2026-01-26 00:11:34', NULL),
(133, 9, 'Alice Johnson', 'Unknown Exam', 'TAB_SWITCH', 'Student switched tabs, minimized window, or switched applications', 'medium', '2026-01-26 00:22:58', NULL),
(134, 9, 'Alice Johnson', 'Unknown Exam', 'TAB_SWITCH', 'Student switched tabs, minimized window, or switched applications', 'medium', '2026-01-26 00:23:11', NULL),
(135, 9, 'Alice Johnson', 'Unknown Exam', 'TAB_SWITCH', 'Student switched tabs, minimized window, or switched applications', 'medium', '2026-01-26 00:25:32', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `administrators`
--
ALTER TABLE `administrators`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `exams`
--
ALTER TABLE `exams`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_id` (`unique_id`),
  ADD KEY `idx_exams_unique_id` (`unique_id`),
  ADD KEY `idx_exams_teacher_id` (`teacher_id`);

--
-- Indexes for table `exam_sessions`
--
ALTER TABLE `exam_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `session_token` (`session_token`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `idx_exam_sessions_exam_id` (`exam_id`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `menu_item_id` (`menu_item_id`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `menu_item_id` (`menu_item_id`);

--
-- Indexes for table `proctoring_settings`
--
ALTER TABLE `proctoring_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_students_student_id` (`student_id`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_system_logs_user_type_id` (`user_type`,`user_id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD KEY `idx_teachers_email` (`email`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `violations`
--
ALTER TABLE `violations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_violations_exam_session_id` (`exam_session_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `administrators`
--
ALTER TABLE `administrators`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `exams`
--
ALTER TABLE `exams`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `exam_sessions`
--
ALTER TABLE `exam_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `proctoring_settings`
--
ALTER TABLE `proctoring_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `violations`
--
ALTER TABLE `violations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=136;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `exams`
--
ALTER TABLE `exams`
  ADD CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `exam_sessions`
--
ALTER TABLE `exam_sessions`
  ADD CONSTRAINT `exam_sessions_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exam_sessions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`);

--
-- Constraints for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`id`);

--
-- Constraints for table `violations`
--
ALTER TABLE `violations`
  ADD CONSTRAINT `violations_ibfk_1` FOREIGN KEY (`exam_session_id`) REFERENCES `exam_sessions` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
