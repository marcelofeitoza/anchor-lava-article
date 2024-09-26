use anchor_lang::prelude::*;

declare_id!("8sHV6MjJSkemTc34PXrymjmungpjgf7b1np52eSnoLBx");

#[program]
pub mod counter_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.bump = ctx.bumps.counter;
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>, amount: u64) -> Result<()> {
        require!(
            amount > 0 && amount >= ctx.accounts.counter.count,
            CounterError::InvalidAmount
        );
        ctx.accounts.counter.count += amount;
        Ok(())
    }

    pub fn decrement(ctx: Context<Decrement>, amount: u64) -> Result<()> {
        require!(
            amount > 0 && amount <= ctx.accounts.counter.count,
            CounterError::InvalidAmount
        );
        ctx.accounts.counter.count -= amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init, 
        seeds = [b"counter", user.key().as_ref()],
        bump,
        payer = user, 
        space = Counter::INIT_SPACE
    )]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Decrement<'info> {
    #[account(mut)]
    pub counter: Account<'info, Counter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Counter {
    pub count: u64,
    pub bump: u8,
}

impl Counter {
    pub const INIT_SPACE: usize = 8 + 8 + 1;
}

#[error_code]
pub enum CounterError {
    #[msg("Amount must be greater than 0")]
    InvalidAmount,
}
