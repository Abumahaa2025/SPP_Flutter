import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Premium icon set — rounded, consistent weight.
class PremiumIcons {
  static const home = Icons.home_rounded;
  static const brain = Icons.hub_rounded;
  static const assistant = Icons.psychology_alt_rounded;
  static const decision = Icons.bolt_rounded;
  static const health = Icons.favorite_rounded;
  static const maintenance = Icons.handyman_rounded;
  static const inbox = Icons.inbox_rounded;
  static const contract = Icons.description_rounded;
  static const memory = Icons.auto_awesome_rounded;
  static const sensor = Icons.sensors_rounded;
  static const payment = Icons.payments_rounded;
  static const property = Icons.apartment_rounded;
  static const subscription = Icons.workspace_premium_rounded;
  static const chat = Icons.chat_bubble_rounded;
  static const arrow = Icons.arrow_back_ios_new_rounded;
  static const power = Icons.electric_bolt_rounded;
  static const water = Icons.water_drop_rounded;
  static const refresh = Icons.autorenew_rounded;
  static const logout = Icons.logout_rounded;
  static const notification = Icons.notifications_none_rounded;
  static const map = Icons.map_rounded;
  static const analytics = Icons.insights_rounded;
  static const mic = Icons.mic_rounded;
  static const send = Icons.send_rounded;
  static const add = Icons.add_rounded;
  static const calendar = Icons.calendar_month_rounded;
  static const trending = Icons.trending_up_rounded;
  static const warning = Icons.warning_amber_rounded;
  static const check = Icons.check_circle_rounded;
  static const crown = Icons.workspace_premium_rounded;
  static const more = Icons.more_horiz_rounded;
  static const ac = Icons.ac_unit_rounded;
  static const plumbing = Icons.plumbing_rounded;
  static const build = Icons.build_rounded;
  static const unit = Icons.home_work_rounded;
  static const vacant = Icons.meeting_room_outlined;
  static const alert = Icons.notifications_active_rounded;

  static Widget inCircle(IconData icon, {Color? color, double size = 22, bool gold = false}) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        gradient: gold
            ? AppColors.goldGradient
            : LinearGradient(
                colors: [
                  (color ?? AppColors.accent).withValues(alpha: 0.25),
                  (color ?? AppColors.accent).withValues(alpha: 0.08),
                ],
              ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: (gold ? AppColors.gold : color ?? AppColors.accent).withValues(alpha: 0.35),
        ),
      ),
      child: Icon(icon, color: gold ? AppColors.bgDeep : color ?? AppColors.accent, size: size),
    );
  }
}
