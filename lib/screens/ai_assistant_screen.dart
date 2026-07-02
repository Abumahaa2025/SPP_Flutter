import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../core/theme/app_colors.dart';
import '../providers/app_state.dart';
import '../widgets/ai_orb.dart';

class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final _controller = TextEditingController();
  final _scroll = ScrollController();

  static const _quickPrompts = [
    'ما وضع العقار اليوم؟',
    'حالة الصحة',
    'بلاغات الصيانة',
    'من المتأخر بالسداد؟',
    'حالة الحساسات',
    'ذاكرة العقار',
    'التنبؤات',
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
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final chat = context.watch<AppState>().chat;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('الموظف الذكي'),
        backgroundColor: Colors.transparent,
      ),
      body: AnimatedBackground(
        child: Column(
          children: [
            const SizedBox(height: kToolbarHeight + 20),
            const AiOrb(size: 80, pulsing: true),
            const SizedBox(height: 8),
            const Text('Unified Brain Assistant', style: TextStyle(color: AppColors.textMuted)),
            const SizedBox(height: 12),
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _quickPrompts.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) => ActionChip(
                  label: Text(_quickPrompts[i], style: const TextStyle(fontSize: 12)),
                  onPressed: () => _send(_quickPrompts[i]),
                  backgroundColor: AppColors.bgElevated,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView.builder(
                controller: _scroll,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: chat.length,
                itemBuilder: (context, index) => _Bubble(message: chat[index], index: index),
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        textInputAction: TextInputAction.send,
                        onSubmitted: _send,
                        decoration: const InputDecoration(
                          hintText: 'اسأل موظفك الذكي...',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () => _send(_controller.text),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.all(14),
                      ),
                      child: const Icon(Icons.send_rounded),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message, required this.index});

  final dynamic message;
  final int index;

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
              ? AppColors.primary.withValues(alpha: 0.25)
              : isInsight
                  ? AppColors.accent.withValues(alpha: 0.12)
                  : AppColors.bgCard,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isUser ? 4 : 18),
            bottomRight: Radius.circular(isUser ? 18 : 4),
          ),
          border: Border.all(
            color: isInsight ? AppColors.accent.withValues(alpha: 0.3) : AppColors.border.withValues(alpha: 0.4),
          ),
        ),
        child: Text(message.text as String, style: const TextStyle(height: 1.5)),
      ),
    )
        .animate(delay: (40 * index).ms)
        .fadeIn(duration: 250.ms)
        .slideY(begin: 0.05);
  }
}
