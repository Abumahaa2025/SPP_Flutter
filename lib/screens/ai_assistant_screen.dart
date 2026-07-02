import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/premium_icons.dart';
import '../core/theme/spp_identity.dart';
import '../providers/app_state.dart';
import '../widgets/ai_orb.dart';
import '../widgets/glass_card.dart';

class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final _controller = TextEditingController();
  final _scroll = ScrollController();

  static const _quickPrompts = [
    'ما قراري الأول اليوم؟',
    'حلل صحة العقار',
    'من يحتاج متابعة عاجلة؟',
    'لخص الوارد الذكي',
  ];

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _send(String text) {
    if (text.trim().isEmpty) return;
    context.read<AppState>().askBrain(text.trim());
    _controller.clear();
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent, duration: SppIdentity.normal, curve: SppIdentity.ease);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final chat = context.watch<AppState>().chat;
    final name = context.watch<AppState>().platform?.ownerName.split(' ').first ?? 'أحمد';

    return Scaffold(
      backgroundColor: AppColors.bgDeep,
      appBar: AppBar(
        title: Column(
          children: [
            const Text('الموظف الذكي', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            Text(SppIdentity.brandTagline, style: TextStyle(fontSize: 10, color: AppColors.textMuted, letterSpacing: 1)),
          ],
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
      ),
      body: Column(
        children: [
          const SizedBox(height: 8),
          const LivingAiOrb(size: 100, heroTag: 'main-orb', luxury: true),
          const SizedBox(height: 16),
          Text('مرحباً $name', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          const Text('أنا موظفك العقاري — اسألني أي شيء', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 16),
          SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: _quickPrompts.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) => ActionChip(
                label: Text(_quickPrompts[i], style: const TextStyle(fontSize: 12)),
                onPressed: () => _send(_quickPrompts[i]),
                backgroundColor: AppColors.bgElevated,
                side: BorderSide(color: AppColors.brand.withValues(alpha: 0.3)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: chat.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Text(
                        'ابدأ المحادثة — سأحلل بيانات عقارك وأقترح الإجراء التالي.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textMuted.withValues(alpha: 0.8), height: 1.6),
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: chat.length,
                    itemBuilder: (context, i) => _Bubble(message: chat[i]),
                  ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: GlassCard(
                blur: 16,
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Row(
                  children: [
                    IconButton(onPressed: () {}, icon: const Icon(PremiumIcons.mic, color: AppColors.brandGlow)),
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        onSubmitted: _send,
                        decoration: const InputDecoration(
                          hintText: 'اسأل موظفك العقاري...',
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(horizontal: 8),
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => _send(_controller.text),
                      icon: const Icon(PremiumIcons.send, color: AppColors.brandGlow),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message});
  final dynamic message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser as bool;
    final isInsight = message.isInsight == true;
    return Align(
      alignment: isUser ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
        decoration: BoxDecoration(
          color: isUser
              ? AppColors.brand.withValues(alpha: 0.2)
              : isInsight
                  ? AppColors.copper.withValues(alpha: 0.12)
                  : AppColors.bgElevated,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isUser ? 4 : 18),
            bottomRight: Radius.circular(isUser ? 18 : 4),
          ),
          border: Border.all(color: isInsight ? AppColors.copper.withValues(alpha: 0.3) : AppColors.borderSubtle),
        ),
        child: Text(message.text as String, style: const TextStyle(height: 1.55)),
      ),
    ).animate().fadeIn(duration: SppIdentity.fast);
  }
}
